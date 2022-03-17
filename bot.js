
/////////// START OF LOGGING ///////////

console.log("____ _                       ");
console.log("|_  /<_> ___  ___  ___  _ _  ");
console.log(" / / | |/ . |/ . |/ ._>| '_> ");
console.log("/___||_|_. |_. |___.|_|      ");
console.log("        <___'<___'           ");

/////////// VARIABLES ///////////

const config = require("./config");
require("dotenv").config({ path: config.index == 1 ? ".env" : ".env2" });
const fs = require("fs");
const Discord = require("discord.js");
const mongoose = require("mongoose");
const template = require("string-placeholder");
const Guild = require("./models/guild");
const Streams = require("./models/streamguilds");
const { AutoPoster } = require("topgg-autoposter");
const mongooseFile = require("./utils/mongoose");
const LMessages = require(`./messages/`);
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");

const rest = new REST({ version: "9" }).setToken(
  process.platform != "linux" && !config.ofi
    ? process.env.TOKEN2
    : process.env.TOKEN
);
const bot = new Discord.Client({
  partials: ["MESSAGE", "CHANNEL", "REACTION"],
  intents: [
    Discord.Intents.FLAGS.GUILDS,
    Discord.Intents.FLAGS.GUILD_MEMBERS,
    Discord.Intents.FLAGS.GUILD_MESSAGES,
    Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    Discord.Intents.FLAGS.GUILD_VOICE_STATES,
    Discord.Intents.FLAGS.GUILD_PRESENCES,
    Discord.Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
  ],
});

module.exports = {
  bot: bot,
};

/////////// EVENTS ///////////

const ready = async () => {
  console.log(" ");
  console.log("Zigger - Pracuji.");

  var mode = 1;

  setInterval(async () => {
    switch (mode) {
      case 1:
        bot.user.setActivity(
          `for ${bot.guilds.cache
            .map((g) => g.memberCount)
            .reduce((a, c) => a + c)} users <3`
        );
        mode = 2;
        break;
      case 2:
        var gGuilds = await Guild.find({});
        bot.user.setActivity(`for ${gGuilds.length} servers <3`);
        mode = 1;
        break;
    }
  }, 10000);

  if (process.platform == "linux" && config.ofi && config.index == 1) {
    AutoPoster(process.env.TOPGG_TOKEN, bot);
  }
  const Com = require("./deploy/commands");

  await rest.put(Routes.applicationCommands(bot.user.id), { body: Com });
  let myGuilds = bot.guilds.cache.filter(
    (x) => x.ownerId == "470568283993538561" && x.name == "Zigger Testing"
  );
  const devCom = require("./deploy/commandsDev");
  myGuilds.each(async (x) => {
    await rest.put(Routes.applicationGuildCommands(bot.user.id, x.id), {
      body: devCom,
    });
  });
};

const guildCreate = (params) => {
  var guild = params[0];
  let channel = guild.channels.cache
    .filter(
      (x) =>
        x.type == "GUILD_TEXT" &&
        x.permissionsFor(guild.me).has("SEND_MESSAGES")
    )
    .first();
  if (channel) {
    if (guild.me.permissions.has("SEND_MESSAGES")) {
      channel.send(
        template(
          LMessages.botJoinsGuild,
          { prefix: config.DefaultPrefix },
          { before: "%", after: "%" }
        )
      );
    }
  }

  console.log("+ Guilda: " + guild.name + "(" + guild.id + ")");
  const guildJoin = new Guild({
    _id: mongoose.Types.ObjectId(),
    guildID: guild.id,
    guildName: guild.name,
    prefix: config.DefaultPrefix,
  });
  guildJoin.save().catch((err) => {
    console.error(err);
    error.sendError(err);
  });
  console.log("MongoDB - Guilda zapsána.");

  if (guild.ownerId == "470568283993538561" && guild.name == "Zigger Testing") {
    const devCom = require("./deploy/commandsDev").dev;
    guild.commands.set([devCom]);
  }
};

const guildDelete = async (params) => {
  var guild = params[0];
  console.log("-Guilda: " + guild.name + ".");

  var res = await Streams.exists({ guildIDs: guild.id });

  if (res) {
    await Streams.updateOne(
      { note: "555" },
      { $pull: { guildIDs: guild.id } },
      { new: true }
    );
    console.log("MongoDB - Odpojeno oznamování.");
  }

  await Guild.deleteOne({ guildID: guild.id });
  console.log("MongoDB - Guilda smazána.");
};

const guildMemberAdd = async (params) => {
  var member = params[0];
  var Gres = await Guild.findOne({
    guildID: member.guild.id,
  });
  if (Gres.autoroleEnabled && Gres.autoRoleIDs.length >= 1) {
    Gres.autoRoleIDs.forEach((rID) => {
      var role = member.guild.roles.cache.get(rID);
      if (!role?.editable) {
        Gres.autoRoleIDs.splice(Gres.autoRoleIDs.indexOf(rID), 1);
      }
    });
    if (member.guild.me.permissions.has("MANAGE_ROLES")) {
      try {
        await member.roles.add(Gres.autoRoleIDs);
      } catch (error) {
        if (!error.message.includes("Missing Permissions"))
          return console.error(error);
      }
    }
  }

  if (Gres.welChannelID != null) {
    let welChannel = bot.channels.cache.get(Gres.welChannelID);
    if (welChannel && member.guild.me.permissions.has("SEND_MESSAGES")) {
      welChannel.send(
        template(
          LMessages.joinMessage,
          { member: `<@${member.user.id}>` },
          { before: "%", after: "%" }
        )
      );
    }
  }
};

const guildMemberRemove = async (params) => {
  var member = params[0];
  if (member.user == bot.user) return;
  var Gres = await Guild.findOne({
    guildID: member.guild.id,
  });

  if (Gres) {
    if (Gres.byeChannelID == null) {
      return;
    } else {
      let byeChannel = bot.channels.cache.get(Gres.byeChannelID);
      if (member.guild.me.permissions.has("SEND_MESSAGES")) {
        if (byeChannel) {
          byeChannel.send(
            template(
              LMessages.leaveMessage,
              { member: member.user.username },
              { before: "%", after: "%" }
            )
          );
        }
      }
    }
  }
};

module.exports.events = {
  ready: ready,
  guildCreate: guildCreate,
  guildDelete: guildDelete,
  guildMemberAdd: guildMemberAdd,
  guildMemberRemove: guildMemberRemove,
};

/////////// EVENT HANDLER ///////////

require("./event_handler");

/////////// LOGIN ///////////

mongooseFile.init();
bot.login(
  process.platform != "linux" && !config.ofi
    ? process.env.TOKEN2
    : process.env.TOKEN
);
