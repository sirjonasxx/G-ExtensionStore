const Discord = require("discord.js");
const {Intents, MessageEmbed} = require("discord.js");
const {extensionConfigs, fileExists} = require("../tests/test_utils");
const compareVersions = require('compare-versions');

const newReleasesChannelId = '876589495586275388';
const updatedChannelId = '876589495586275388'; // same channel for now at least
const gearthDiscord = '744927320871010404';


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

        const releasesChannel = await client.channels.fetch(newReleasesChannelId);
        const updatedChannel = await client.channels.fetch(updatedChannelId);
        const guild = await client.guilds.fetch(gearthDiscord);
        const members = await guild.members.fetch({cache : false});


        for(const ext of newExtensions) {
            const embed = releaseEmbed(ext);
            const author = await getAuthorAsGuildMember(ext, members);

            const authorStr = author === null ? ext.authors[0].name : author.toString();
            const content = authorStr + " just released a new extension, get it now in the extension store!\n" +
                "Make sure to leave a :thumbsup: if you like it!";

            const response = await releasesChannel.send({
                content: content,
                embeds: [embed]
            });
        }

        for(const ext of updatedExtensions) {
            const embed = releaseEmbed(ext);
            const author = await getAuthorAsGuildMember(ext, members);

            const authorStr = author === null ? ext.authors[0].name : author.toString();
            const oldVersion = cachedNameToVersion.get(ext.title);
            const content = authorStr + ` updated \`${ext.title}\` from version \`${oldVersion}\` to \`${ext.version}\`!`;

            const showEmbed = false; // do something to decide this... perhaps if enough time has passed since the previous time it was shown

            let response;
            if (showEmbed) response = await releasesChannel.send({content: content, embeds: [embed]});
            else response = await releasesChannel.send({content: content});


        }

        client.destroy();
    });
}

if (newExtensions.length > 0 || updatedExtensions.length > 0) {
    bumpChannels();
}
