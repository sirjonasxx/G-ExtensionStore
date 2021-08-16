const Discord = require("discord.js");
const {Intents, MessageEmbed} = require("discord.js");
const {extensionConfigs, fileExists} = require("../tests/test_utils");
const compareVersions = require('compare-versions');

const {serverInfo} = require("./serverInfo");


const allExtensions = extensionConfigs();
const discordCache = require(__dirname + "/../../.auto-generated/discord/cache.json");
const fs = require("fs");
const cachedNameToVersion = new Map(discordCache.map(ext => [ext.title, ext.version]));

const newExtensions = allExtensions.filter((ext) => !cachedNameToVersion.has(ext.title));
const updatedExtensions = allExtensions.filter((ext) =>
    cachedNameToVersion.has(ext.title) && compareVersions(ext.version, cachedNameToVersion.get(ext.title)) > 0);


const embedExtension = (ext) => {
    const embed = new MessageEmbed();

    embed
        .setColor('#c3e002')
        .setTitle(ext.title)
        .setURL(ext.source)
        .setAuthor(ext.authors[0].name)
        .setDescription(ext.description);

    const iconPath = `./store/extensions/${ext.title}/icon.png`;
    if (fileExists(iconPath)) {
        const url = `https://raw.githubusercontent.com/sirjonasxx/G-ExtensionStore/HEAD/store/extensions/${ext.title}/icon.png`;
        embed.setThumbnail(url);
    }

    if (ext.authors.length > 1) {
        embed.addField("Authors", ext.authors.join(", "));
    }
    if (ext.readme != null) {
        embed.addField("Readme", `[Click here!](${ext.readme})`, true);
    }
    embed
        .addField("Version", ext.version, true)
        .addField("Client", ext.compatibility.clients.join(", "), true)
        .addField("Categories", ext.categories.join(", "));

    const screenshotPath = `./store/extensions/${ext.title}/screenshot.png`;
    if (fileExists(screenshotPath)) {
        const url = `https://raw.githubusercontent.com/sirjonasxx/G-ExtensionStore/HEAD/store/extensions/${ext.title}/screenshot.png`;
        embed.setImage(url);
    }

    embed
        .setTimestamp()
        .setFooter(`${ext.framework.name.replace('Native', 'Native (G-Earth)')}`);

    return embed;
}

const writeCache = () => {
    const dir = __dirname + '/../../.auto-generated/discord';
    fs.writeFileSync(
        `${dir}/cache.json`,
        JSON.stringify(discordCache, null, 2)
    );
}

const getAuthorAsGuildMember = async (ext, members) => {

    for(const author of ext.authors) {
        if(author.discord !== null) {
            const member = await members.find(m => m.user.tag === author.discord);
            if (member !== undefined) {
                return member;
            }
        }
    }

    return null;
}

const bumpChannels = async() => {
    const client = new Discord.Client({
        intents: [
            Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
            Intents.FLAGS.GUILD_MESSAGES,
            Intents.FLAGS.GUILD_MEMBERS
        ]
    });

    await client.login(process.env.DISCORD_TOKEN);

    client.on('ready', async () => {

        const releasesChannel = await client.channels.fetch(serverInfo.releasesChannelId);
        const updatedChannel = await client.channels.fetch(serverInfo.updatedChannelId);
        const guild = await client.guilds.fetch(serverInfo.guildId);
        const members = await guild.members.fetch({cache : false});


        for(const ext of newExtensions) {
            const embed = embedExtension(ext);
            const author = await getAuthorAsGuildMember(ext, members);

            const authorStr = author === null ? ext.authors[0].name : author.toString();
            const content = authorStr + " just released a new extension, get it now in the extension store!\n" +
                "Make sure to leave a :thumbsup: if you like it!";

            const message = await releasesChannel.send({
                content: content,
                embeds: [embed]
            });

            const messageId = message.id;
            discordCache.push({
                title: ext.title,
                version: ext.version,
                _object: ext,
                discordMessages: [{
                    channelId: serverInfo.releasesChannelId,
                    guildId: serverInfo.guildId,
                    messageId: messageId,
                    extVersion: ext.version,
                    type: "publish"
                }],
                latestEmbed: Date.now()
            });
        }

        writeCache();

        for(const ext of updatedExtensions) {
            const embed = embedExtension(ext);
            const author = await getAuthorAsGuildMember(ext, members);

            const authorStr = author === null ? ext.authors[0].name : author.toString();
            const oldVersion = cachedNameToVersion.get(ext.title);
            const content = authorStr + ` updated \`${ext.title}\` from version \`${oldVersion}\` to \`${ext.version}\`!`;

            const cacheExt = discordCache.find(obj => obj.title === ext.title);

            const showEmbed = cacheExt.latestEmbed < Date.now() - 1000 * 60 * 60 * 24 * 3;

            let message;
            if (showEmbed) message = await updatedChannel.send({content: content, embeds: [embed]});
            else message = await updatedChannel.send({content: content});

            const messageId = message.id;
            cacheExt.version = ext.version;
            cacheExt._object = ext;
            cacheExt.discordMessages.push({
                channelId: serverInfo.updatedChannelId,
                guildId: serverInfo.guildId,
                messageId: messageId,
                extVersion: ext.version,
                type: "update"
            });
            if (showEmbed) {
                cacheExt.latestEmbed = Date.now();
            }
        }

        writeCache();

        client.destroy();
    });
}

if (newExtensions.length > 0 || updatedExtensions.length > 0) {
    bumpChannels();
}
