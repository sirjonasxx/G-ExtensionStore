const Discord = require("discord.js");
const client = new Discord.Client();

client.login(process.env.DISCORD_TOKEN);


client.on('ready', () => {
    client.channels.fetch('876589495586275388')
        .then(channel => {
            channel.send("test!");
        })
});
