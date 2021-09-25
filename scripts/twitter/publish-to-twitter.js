const { TwitterApi } = require('twitter-api-v2');
const {extensionConfigs, fileExists} = require("../tests/test_utils");
const twitterCache = require(__dirname + "/../../.auto-generated/twitter/cache.json");
const fs = require("fs");
const compareVersions = require("compare-versions");

const allExtensions = extensionConfigs();
const cachedNameToVersion = new Map(twitterCache.map(ext => [ext.title, ext.version]));
const cachedNameToOutdated = new Map(twitterCache.map(ext => [ext.title, ext.isOutdated ?? false]));

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
    const authorInTweet = author.twitter !== undefined ? "@" + author.twitter : author.name;

    const tweetContents = `A new extension "${ext.title}" was published to the G-ExtensionStore!` +
        ` Created by ${authorInTweet}.${readMore}`;
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
    const authorInTweet = author.twitter !== undefined ? "@" + author.twitter : author.name;

    const tweetContents = `"${ext.title}" was updated from ${oldVersion} to ${ext.version}!` +
        ` Created by ${authorInTweet}.${readMore}`;

    console.log(`Updating ${ext.title} on twitter...`)
    return await client.v1.tweet(tweetContents);
}

const removeExtensionTweet = async (client, ext) => {
    const author = ext.authors[0];
    const authorInTweet = author.twitter !== undefined ? "@" + author.twitter : author.name;

    const tweetContents = `"${ext.title}" by ${authorInTweet} was removed from the G-ExtensionStore`;

    console.log(`Removing ${ext.title} on twitter...`)
    return await client.v1.tweet(tweetContents);
}

const bumpTwitter = async (newExtensions, updatedExtensions, removedExtensions) => {
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
            isOutdated: false,
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
        const oldVersion = cachedNameToVersion.get(ext.title);
        const actualTweet = await updateExtensionTweet(client, oldVersion, ext);

        const cacheObj = twitterCache.find(obj => obj.title === ext.title);
        cacheObj.version = ext.version;
        cacheObj.isOutdated = false;
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

    for (const ext of removedExtensions) {
        const actualTweet = await removeExtensionTweet(client, ext);

        const cacheObj = twitterCache.find(obj => obj.title === ext.title);
        cacheObj.version = ext.version;
        cacheObj.isOutdated = true;
        cacheObj._object = ext;
        cacheObj.tweets.push({
            id_str: actualTweet.id_str,
            extVersion: ext.version,
            type: "remove",
            timestamp: Date.now(),
            locked: false,      // not implemented
            score: 0            // not implemented
        });

        await new Promise(r => setTimeout(r, 5000));
    }

    writeCache();
}


const newExtensions = allExtensions.filter((ext) => !ext.isOutdated && !cachedNameToVersion.has(ext.title));
const updatedExtensions = allExtensions.filter((ext) => !ext.isOutdated &&
    cachedNameToVersion.has(ext.title) && compareVersions(ext.version, cachedNameToVersion.get(ext.title)) > 0);
const removedExtensions = allExtensions.filter((ext) => ext.isOutdated &&
    cachedNameToOutdated.has(ext.title) && !cachedNameToOutdated.get(ext.title));

if (newExtensions.length > 0 || updatedExtensions.length > 0 || removedExtensions.length > 0) {
    bumpTwitter(newExtensions, updatedExtensions, removedExtensions).then(r => console.log("finished"));
}
