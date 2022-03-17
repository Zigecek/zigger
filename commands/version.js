
const Discord = require("discord.js");
const si = require("systeminformation");
const { exec } = require("child_process");
const package = require("../package.json");
const { bot } = require("../bot");

module.exports = {
  name: "version",
  cooldown: 5,
  aliases: ["v"],
  category: "other",
  async execute(message, serverQueue, args, Gres, prefix, command, isFS) {
    function getExec(string) {
      return new Promise((resolve, reject) => {
        exec(string, (err, stdout) => {
          if (err) reject(err);
          resolve(stdout);
        });
      });
    }

    const emGuild = await bot.guilds.fetch("870236948772565032");
    const emojis = await emGuild.emojis.fetch();

    const npm = await getExec("npm -v");
    const pm2 = await getExec("pm2 -v");
    const sys =
      process.platform == "linux"
        ? emojis.find((e) => e.name == "linux").toString()
        : process.platform == "win32"
        ? emojis.find((e) => e.name == "windows").toString()
        : "unknown";
    const arch = process.arch;
    const node = process.version;
    const pkg = package.version;
    const djs = package.dependencies["discord.js"].replace("^", "");
    const mi = await si.mem();
    const mem =
      (mi.used / 1000 / 1000 / 1000).toFixed(2) +
      " Gb / " +
      (mi.total / 1000 / 1000 / 1000).toFixed(2) +
      " Gb";

    var embed = new Discord.MessageEmbed()
      .addField(
        `**${emojis.find((e) => e.name == "box").toString()} | Bot's version**`,
        pkg,
        false
      )
      .addField(
        `**${emojis.find((e) => e.name == "nodejs").toString()} | Node.js**`,
        node,
        false
      )
      .addField(
        `**${emojis.find((e) => e.name == "npm").toString()} | NPM**`,
        npm,
        false
      )
      .addField(
        `**${emojis.find((e) => e.name == "djs").toString()} | Discord.js**`,
        djs,
        false
      )
      .addField(
        `**${emojis.find((e) => e.name == "pm2").toString()} | PM2**`,
        pm2,
        false
      )
      .addField(
        `**${emojis.find((e) => e.name == "mem").toString()} | RAM**`,
        mem,
        false
      )
      .addField(
        `**${emojis.find((e) => e.name == "cpu").toString()} | CPU**`,
        arch,
        false
      )
      .addField(`**System**`, sys, false);
    message.channel.send({ embeds: [embed] });
  },
};
