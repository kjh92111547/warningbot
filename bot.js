const { Client, GatewayIntentBits, Events, REST, Routes } = require('discord.js');
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

client.on(Events.MessageCreate, async (message) => {
    const cmd = message.content
    if (cmd == "안녕"){
        message.reply("안녕하세요?")
    } ;

})
client.login("MTMxNDY1NDkzNjI5ODE2NDI0NA.GKNcEE.2atWB6mQXAemVppjFZlVNtZAZnBflMxnH2gwwI");
