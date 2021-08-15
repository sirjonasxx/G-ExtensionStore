const Discord = require("discord.js");
const {Intents} = require("discord.js");
const client = new Discord.Client({
    intents: [
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        Intents.FLAGS.GUILD_MESSAGES
    ]
});

client.login(process.env.DISCORD_TOKEN);


client.on('ready', () => {
    client.channels.fetch('876589495586275388')
        .then(channel => {
            channel.send("test!");
        })
});
