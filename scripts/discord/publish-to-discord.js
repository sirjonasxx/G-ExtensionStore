const Discord = require("discord.js");
const {Intents} = require("discord.js");
const {extensionConfigs, fileExists} = require("../tests/test_utils");
const compareVersions = require('compare-versions');

const newReleasesChannelId = '876589495586275388';
const updatedChannelId = '876603027644116992';


const allExtensions = extensionConfigs();
const discordCache = require(__dirname + "/../../.auto-generated/discord/cache.json");
const cachedNameToVersion = new Map(discordCache.map(ext => [ext.title, ext.version]));

const newExtensions = allExtensions.filter((ext) => !cachedNameToVersion.has(ext.title));
const updatedExtensions = allExtensions.filter((ext) =>
    cachedNameToVersion.has(ext.title) && compareVersions(ext.version, cachedNameToVersion.get(ext.title)) > 0);


const releaseEmbed = (ext) => {
    const embed = new MessageEmbed();

    embed
        .setColor('#c3e002')
        .setTitle(ext.title)
        .setURL(ext.source)
        .setAuthor(ext.authors[0].name)
        .setDescription(ext.description);

    const iconPath = `./store/extensions/${extension.name}/icon.png`;
    if (fileExists(iconPath)) {
        const url = `https://raw.githubusercontent.com/sirjonasxx/G-ExtensionStore/HEAD/store/extensions/${extension.name}/icon.png`;
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
        .addField("Categories", ext.categories.join(", "));

    const screenshotPath = `./store/extensions/${extension.name}/screenshot.png`;
    if (fileExists(screenshotPath)) {
        const url = `https://raw.githubusercontent.com/sirjonasxx/G-ExtensionStore/HEAD/store/extensions/${extension.name}/screenshot.png`;
        embed.setImage(url);
    }

    embed
        .setTimestamp()
        .setFooter(`Framework: ${ext.framework.name.replace('Native', 'Native (G-Earth)')}`);

    return embed;
}


const bumpChannels = async() => {
    const client = new Discord.Client({
        intents: [
            Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
            Intents.FLAGS.GUILD_MESSAGES
        ]
    });


    await client.login(process.env.DISCORD_TOKEN);


    client.on('ready', async () => {
        const releasesChannel = await client.channels.fetch(newReleasesChannelId);
        const updatedChannel = await client.channels.fetch(updatedChannelId);

        for(const newExtension of newExtensions) {
            const embed = releaseEmbed(newExtension);
            const response = await releasesChannel.send("Woah, a new extension! Have you tried it? Leave a :thumb_up:!", embed);
        }

        client.destroy();
    });
}

if (newExtensions.length > 0 || updatedExtensions.length > 0) {
    bumpChannels();
}
