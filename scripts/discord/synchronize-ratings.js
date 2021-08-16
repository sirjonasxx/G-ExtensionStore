// synchronizes extension upvotes from discord to the store/ratings.json file

const Discord = require("discord.js");
const {Intents, MessageEmbed} = require("discord.js");

const {serverInfo} = require("./serverInfo");

const discordCache = require(__dirname + "/../../.auto-generated/discord/cache.json");
const fs = require("fs");


const writeCache = () => {
    const dir = __dirname + '/../../.auto-generated/discord';
    fs.writeFileSync(
        `${dir}/cache.json`,
        JSON.stringify(discordCache, null, 2)
    );
}

const discordMsgs = new Map(discordCache.map(ext => ext.discordMessages).flat().map(msg => [msg.messageId, msg]));
const sorted = [... discordMsgs.keys()].sort((id1, id2) => discordMsgs.get(id1).timestamp - discordMsgs.get(id2).timestamp);
for (let i = 0; i < sorted.length - 300; i += 1) { // fetch only most recent X discord messages
    discordMsgs.get(sorted[i]).locked = true;
}

const fetchRatings = async () => {

    const ratings = [];

    const client = new Discord.Client({
        intents: [
            Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
            Intents.FLAGS.GUILD_MESSAGES,
            Intents.FLAGS.GUILD_MEMBERS,
        ]
    });

    await client.login(process.env.DISCORD_TOKEN);

    client.on('ready', async () => {
        const releasesChannel = await client.channels.fetch(serverInfo.releasesChannelId);
        const updatedChannel = await client.channels.fetch(serverInfo.updatedChannelId);
        // const guild = await client.guilds.fetch(serverInfo.guildId);

        for (const ext of discordCache) {
            const msgs = ext.discordMessages;
            const ratingsObject = {extension: ext.title, rating: msgs.length * 10};
            ratings.push(ratingsObject);

            const bonusRatings = new Map([
                ['⭐', 50], ['✅', 100], ['💩', -20],
                ['👌', 70], ['🔥', 120], ['😍', 200], ['👶', -80]
            ]);

            for (const msg of msgs) {
                let score = 0;
                if (msg.locked) {
                    score = msg.score;
                }
                else {
                    try {
                        const channel = msg.type === "publish" ? releasesChannel : updatedChannel;
                        const message = await channel.messages.fetch(msg.messageId);

                        const reactions = message.reactions.cache;
                        const thumbups = reactions.get('👍') === undefined ? 0 : reactions.get('👍').count;

                        score += (msg.type === "publish"
                                ? thumbups * 20
                                : Math.max(thumbups - 3, 0) * 25
                        );

                        for (const [bonus, value] of bonusRatings) {
                            if (reactions.has(bonus)) {
                                score += (msg.type === "publish" ? value : value/2);
                            }
                        }

                        msg.score = score;

                    } catch(ignore) {
                        score = msg.score;
                    }
                }
                ratingsObject.rating += score;

            }
        }

        const dir = __dirname + '/../../store/';
        fs.writeFileSync(
            `${dir}/ratings.json`,
            JSON.stringify(ratings, null, 2)
        );

        writeCache();

        client.destroy();
    });

}

fetchRatings();
