const { TwitterApi } = require('twitter-api-v2');
const {extensionConfigs, fileExists} = require("../tests/test_utils");
const twitterCache = require(__dirname + "/../../.auto-generated/twitter/cache.json");
const fs = require("fs");
const compareVersions = require("compare-versions");

const allExtensions = extensionConfigs();
const cachedNameToVersion = new Map(twitterCache.map(ext => [ext.title, ext.version]));

const writeCache = () => {
    const dir = __dirname + '/../../.auto-generated/twitter';
    fs.writeFileSync(
        `${dir}/cache.json`,
        JSON.stringify(twitterCache, null, 2)
    );
}

const publishExtensionTweet = async (client, ext) => {
    const readMore = ext.readme !== undefined ? ` \n\nRead more: ${ext.readme}` : ""
    const author = ext.authors[0];
    const tweetContents = `A new extension "${ext.title}" was published to the G-ExtensionStore!` +
        ` Created by ${author.twitter !== undefined ? "@" + author.twitter : author.name}.${readMore}`;
    // const mediaId = await client.v1.uploadMedia('image.png');

    const screenshotPath = `./store/extensions/${ext.title}/screenshot.png`;

    console.log(`Publishing ${ext.title} on twitter...`)
    if (fileExists(screenshotPath)) {
        const mediaId = await client.v1.uploadMedia(screenshotPath);
        return await client.v1.tweet(tweetContents, { media_ids: mediaId });
    }
    else {
        return await client.v1.tweet(tweetContents);
    }
}
const updateExtensionTweet = async (client, oldVersion, ext) => {
    const readMore = ext.readme !== undefined ? ` \n\nRead more: ${ext.readme}` : ""
    const author = ext.authors[0];
    const tweetContents = `"${ext.title}" was updated from ${oldVersion} to ${ext.version}!` +
        ` Created by ${author.twitter !== undefined ? "@" + author.twitter : author.name}.${readMore}`;

    console.log(`Updating ${ext.title} on twitter...`)
    return await client.v1.tweet(tweetContents);
}

const bumpTwitter = async (newExtensions, updatedExtensions) => {
    const client = new TwitterApi({
        appKey: process.env.TWITTER_APPKEY,
        appSecret: process.env.TWITTER_APPSECRET,
        accessToken: process.env.TWITTER_ACCESSTOKEN,
        accessSecret: process.env.TWITTER_ACCESSSECRET
    });

    for (const ext of newExtensions) {
        const actualTweet = await publishExtensionTweet(client, ext);
        twitterCache.push({
            title: ext.title,
            version: ext.version,
            _object: ext,
            tweets: [{
                id_str: actualTweet.id_str,
                extVersion: ext.version,
                type: "publish",
                timestamp: Date.now(),
                locked: false,      // not implemented
                score: 0            // not implemented
            }]
        });

        await new Promise(r => setTimeout(r, 5000));
    }

    writeCache();

    for (const ext of updatedExtensions) {
        const oldVersion = cachedNameToVersion(ext.title);
        const actualTweet = await updateExtensionTweet(client, oldVersion, ext);

        const cacheObj = twitterCache.find(obj => obj.title === ext.title);
        cacheObj.version = ext.version;
        cacheObj._object = ext;
        cacheObj.tweets.push({
            id_str: actualTweet.id_str,
            extVersion: ext.version,
            type: "update",
            timestamp: Date.now(),
            locked: false,      // not implemented
            score: 0            // not implemented
        });

        await new Promise(r => setTimeout(r, 5000));
    }

    writeCache();
}


const newExtensions = allExtensions.filter((ext) => !cachedNameToVersion.has(ext.title));
const updatedExtensions = allExtensions.filter((ext) =>
    cachedNameToVersion.has(ext.title) && compareVersions(ext.version, cachedNameToVersion.get(ext.title)) > 0);

if (newExtensions.length > 0 || updatedExtensions.length > 0) {
    bumpTwitter(newExtensions, updatedExtensions).then(r => console.log("finished"));
}
