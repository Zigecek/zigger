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

const { bot } = require("../bot");
const error = require("./error");
const Guild = require("../models/guild");
const functions = require("./functions");
const LMessages = require(`../messages/`);

bot.on("ready", () => {
  callLoop();
  console.log(" ");
  console.log("Počítadla - Počítám.");
});

function callLoop() {
  setInterval(() => {
    Guild.find({}).then((gGuilds) => {
      gGuilds.forEach(async (Gres) => {
        let guild = await bot.guilds.fetch(Gres.guildID);
        if (!guild) {
          return;
        }

        if (Gres.counters != null) {
          let counters = Gres.counters;
          if (counters.length != 0) {
            if (!guild.me.permissions.has("MANAGE_CHANNELS")) {
              functions.shout(
                `${LMessages.count.noPermission} \n${LMessages.rejoinRecommended}`,
                guild
              );
              return;
            }
            let category = await bot.channels.fetch(
              Gres.countersCategoryChannelID
            );
            if (!category) {
              if (guild.me.permissions.has("MANAGE_CHANNELS")) {
                guild.channels
                  .create(LMessages.countCategoryName, {
                    type: "GUILD_CATEGORY",
                  })
                  .then((cat) => {
                    category = cat;
                    Guild.findOneAndUpdate(
                      {
                        guildID: guild.id,
                      },
                      {
                        countersCategoryChannelID: category.id,
                      },
                      function (err) {
                        if (err) {
                          console.error(err);
                          error.sendError(err);
                          return;
                        }
                      }
                    );
                  });
              }
            }
            if (guild.me.permissions.has("MANAGE_CHANNELS")) {
              category.setPosition(0);
            }

            var m = await guild.members.fetch({ withPresences: true });
            var r = guild.roles.cache;
            var c = await guild.channels.fetch();
            var em = await guild.emojis.fetch();

            counters.forEach(async (e) => {
              if (!c.has(e.channelID)) {
                Guild.findOneAndUpdate(
                  { guildID: Gres.guildID },
                  { $pull: { counters: e } },
                  (err, res) => {
                    if (err) {
                      console.error(err);
                      error.sendError(err);
                      return;
                    }
                  }
                );
                return;
              }

              const channel = c.get(e.channelID);
              var count = 0;

              switch (e.type) {
                case "all":
                  count = guild.memberCount;
                  break;
                case "bots":
                  count = m.filter((x) => x.user.bot).size;
                  break;
                case "members":
                  count = m.filter((x) => !x.user.bot).size;
                  break;
                case "offline":
                  count = m.filter(
                    (x) =>
                      !x.user.bot &&
                      (x.presence?.status ?? "offline") == "offline"
                  ).size;
                  break;
                case "online":
                  count = m.filter(
                    (x) => !x.user.bot && x.presence?.status == "online"
                  ).size;
                  break;
                case "idle":
                  count = m.filter(
                    (x) => !x.user.bot && x.presence?.status == "idle"
                  ).size;
                  break;
                case "dnd":
                  count = m.filter(
                    (x) => !x.user.bot && x.presence?.status == "dnd"
                  ).size;
                  break;
                case "notOffline":
                  count = m.filter(
                    (x) =>
                      !x.user.bot &&
                      ["online", "idle", "dnd"].includes(x.presence?.status)
                  ).size;
                  break;
                case "roles":
                  count = r.size - 1;
                  break;
                case "channels":
                  count = c.size;
                  break;
                case "text":
                  count = c.filter((x) => x.type == "GUILD_TEXT").size;
                  break;
                case "voice":
                  count = c.filter((x) => x.type == "GUILD_VOICE").size;
                  break;
                case "categories":
                  count = c.filter((x) => x.type == "GUILD_CATEGORY").size;
                  break;
                case "announcement":
                  count = c.filter((x) => x.type == "GUILD_NEWS").size;
                  break;
                case "stages":
                  count = c.filter((x) => x.type == "GUILD_STAGE").size;
                  break;
                case "emojis":
                  count = em.size;
                  break;
                case "boosters":
                  count = m.filter((m) => m.permiumSince).size;
                  break;
                case "tier":
                  count = guild.premiumTier;
                  break;
              }

              if (channel) {
                if (channel.parent.id != category.id) {
                  if (guild.me.permissions.has("MANAGE_CHANNELS")) {
                    channel.setParent(category);
                  }
                }
                let numbers = channel.name.match(/\d+/);
                if (numbers.length > 0) {
                  var name = channel.name;
                  name = name.replace(/\d+/, count.toString());
                  if (name != channel.name) {
                    if (guild.me.permissions.has("MANAGE_CHANNELS")) {
                      channel.setName(name);
                    }
                  }
                } else {
                  if (guild.me.permissions.has("MANAGE_CHANNELS")) {
                    channel.setName(channel.name + " " + count);
                  }
                }
              } else {
                Guild.findOneAndUpdate(
                  { guildID: Gres.guildID },
                  { $pull: { counters: e } },
                  (err, res) => {
                    if (err) {
                      console.error(err);
                      error.sendError(err);
                      return;
                    }
                  }
                );
              }
            });
          }
        }
      });
    });
  }, 10 * 60 * 1000);
}

bot.on("channelDelete", async (channel) => {
  Guild.findOne(
    {
      guildID: channel.guild.id,
    },
    async (err, Gres) => {
      if (err) {
        console.error(err);
        error.sendError(err);
        return;
      }

      if (!Gres.countersSetupDone) return;
      if (Gres.countersCategoryChannelID != channel.id) return;

      if (Gres.counters.length > 0) {
        Gres.counters.forEach(async (e) => {
          let channel = await message.guild.channels.fetch(e.channelID);
          if (channel) {
            if (channel.deletable == true) {
              channel.delete();
            }
          }
        });
      }
      let category = await message.guild.channels.fetch(
        Gres.countersCategoryChannelID
      );
      if (category) {
        if (category.deletable) {
          category.delete();
        }
      }
      Guild.findOneAndUpdate(
        {
          guildID: message.guild.id,
        },
        {
          counters: [],
          countersCategoryChannelID: null,
          countersSetupDone: false,
        },
        function (err) {
          if (err) {
            console.error(err);
            error.sendError(err);
            return;
          }
        }
      );
    }
  );
});