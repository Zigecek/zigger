/*****************************************************************************
__/\\\\\\\\\\\\\\\__/\\\\\\\\\\\_____/\\\\\\\\\\\\__/\\\\\\\\\\\\\\\_        
 _\////////////\\\__\/////\\\///____/\\\//////////__\/\\\///////////__       
  ___________/\\\/_______\/\\\______/\\\_____________\/\\\_____________      
   _________/\\\/_________\/\\\_____\/\\\____/\\\\\\\_\/\\\\\\\\\\\_____     
    _______/\\\/___________\/\\\_____\/\\\___\/////\\\_\/\\\///////______    
     _____/\\\/_____________\/\\\_____\/\\\_______\/\\\_\/\\\_____________   
      ___/\\\/_______________\/\\\_____\/\\\_______\/\\\_\/\\\_____________  
       __/\\\\\\\\\\\\\\\__/\\\\\\\\\\\_\//\\\\\\\\\\\\/__\/\\\\\\\\\\\\\\\_ 
        _\///////////////__\///////////___\////////////____\///////////////__
*****************************************************************************/
const fetch = require("cross-fetch");
const Discord = require("discord.js");
const LMessages = require(`../messages/`);
const { followReply } = require("../utils/functions");

module.exports = {
  name: "urban",
  aliases: [],
  cooldown: 3,
  category: "fun",
  async execute(int, serverQueue, Gres) {
    if (!int.channel.permissionsFor(int.guild.me).has("SEND_MESSAGES")) return;
    if (!int.guild.me.permissions.has("EMBED_LINKS"))
      return followReply(int, { content: LMessages.help.noPermission });
    get(int);
  },
};

async function get(int) {
  const term = int.options.get("query").value;
  console.log(term);
  const query = new URLSearchParams({ term });

  const res = await fetch(
    `https://api.urbandictionary.com/v0/define?${query}`
  ).then((response) => response.json());
  console.log(res);
  var body = res.list;
  if (body.length == 0) {
    followReply(int, { content: LMessages.urban.nothingFound });
    return;
  }
  var index = 0;

  function getRow(ind, bod) {
    ind = Number(ind);
    return new Discord.MessageActionRow().setComponents([
      new Discord.MessageButton()
        .setCustomId("prev")
        .setLabel("←")
        .setStyle("PRIMARY")
        .setDisabled(ind == 0 ? true : false),
      new Discord.MessageButton()
        .setCustomId("next")
        .setLabel("→")
        .setStyle("PRIMARY")
        .setDisabled(index == bod.length - 1 ? true : false),
    ]);
  }
  function getEmbed(ind, bod) {
    ind = Number(ind);
    return new Discord.MessageEmbed()
      .setColor("NOT_QUITE_BLACK")
      .setURL(bod[ind].permalink)
      .setTitle(bod[ind].word)
      .setDescription(bod[ind].definition)
      .addField("Example", bod[ind].example, false)
      .setFooter(
        `by ${bod[ind].author} \n👍${bod[ind].thumbs_up} 👎${
          bod[ind].thumbs_down
        } \nPage: ${index + 1}/${bod.length}`
      );
  }

  followReply(int, {
    embeds: [getEmbed(index, body)],
    components: [getRow(index, body)],
  }).then((msg) => {
    const filter = (inter) => inter.member.id == int.member.id;
    const collector = msg.createMessageComponentCollector({
      filter,
      time: 2 * 60 * 60_000,
    });
    collector
      .on("collect", (interact) => {
        if (!interact.isButton()) return;
        var id = interact.component.customId;
        if (id == "prev") {
          if (index == 0) return;
          index -= 1;
          if (msg.editable) {
            msg.edit({
              embeds: [getEmbed(index, body)],
              components: [getRow(index, body)],
            });
            interact.deferUpdate();
          }
        } else if (id == "next") {
          if (index == body.length - 1) return;
          index += 1;
          if (msg.editable) {
            msg.edit({
              embeds: [getEmbed(index, body)],
              components: [getRow(index, body)],
            });
            interact.deferUpdate();
          }
        }
      })
      .on("end", async () => {
        if (msg) {
          msg.components.forEach((r) => {
            r.forEach((b) => {
              b.setDisabled(true);
            });
          });
        }
      });
  });
}