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

const messageCreate = async (params) => {
  var message = params[0];
  if (!message) return;
  if (message.partial) await message.fetch();
  if (message.guild == null) await message.fetch();
  if (
    message.author == bot.user ||
    message.channel == "DM" ||
    message.author.bot == true
  ) {
    return;
  }

  let userConst = {
    userID: "99999999999",
    curMessCount: 1,
    lastMesss: [],
    lastMess: new Date(),
    mutes: 0,
    muteLength: 0.25,
  };

  let Gres = await Guild.findOne(
    {
      guildID: message.guild.id,
    },
    (err, Gres) => {
      if (err) {
        console.error(err);
        error.sendError(err);
        return;
      }
      return Gres;
    }
  );

  if (!Gres) return;

  if (Gres.spamEnabled == false) {
    return;
  }

  if (Gres.spamIgnoreAdmins) {
    if (message.member.permissions.has("ADMINISTRATOR")) {
      return;
    }
  }
  const LMessages = require(`../messages/`);

  let spam = Gres.spam.filter((v) => v.userID == message.author.id);

  if (spam.length > 0) {
    let sp = spam[0];
    if (new Date() - sp.lastMess >= Gres.spamDelay) {
      sp.curMessCount = 1;
      sp.lastMess = new Date();
      sp.lastMesss = [[message.id, message.channel.id]];
      Guild.findOneAndUpdate(
        {
          guildID: message.guild.id,
          "spam.userID": message.author.id,
        },
        {
          $set: {
            "spam.$.userID": sp.userID,
            "spam.$.curMessCount": sp.curMessCount,
            "spam.$.lastMess": sp.lastMess,
            "spam.$.mutes": sp.mutes,
            "spam.$.muteLength": sp.muteLength,
            "spam.$.lastMesss": sp.lastMesss,
          },
        },
        function (err, res) {
          if (err) {
            console.error(err);
            error.sendError(err);
            return;
          }
        }
      );
    } else {
      sp.curMessCount += 1;
      sp.lastMess = new Date();
      sp.lastMesss.push([message.id, message.channel.id]);
      if (sp.curMessCount >= 3 && sp.curMessCount < 4) {
        delMesss(sp.lastMesss);
        sp.lastMesss = [];

        if (message.guild.me.permissions.has("SEND_MESSAGES")) {
          message.reply(LMessages.antispam.util.stopSpaming);
        }

        Guild.findOneAndUpdate(
          {
            guildID: message.guild.id,
            "spam.userID": message.author.id,
          },
          {
            $set: {
              "spam.$.userID": sp.userID,
              "spam.$.curMessCount": sp.curMessCount,
              "spam.$.lastMess": sp.lastMess,
              "spam.$.mutes": sp.mutes,
              "spam.$.muteLength": sp.muteLength,
              "spam.$.lastMesss": sp.lastMesss,
            },
          },
          function (err, res) {
            if (err) {
              console.error(err);
              error.sendError(err);
              return;
            }
          }
        );
      } else if (sp.curMessCount >= 5) {
        sp.mutes += 1;
        delMesss(sp.lastMesss);
        sp.lastMesss = [];
        if (sp.mutes <= 3) {
          let mRole = message.guild.roles.cache.get(Gres.spamMuteRoleID);
          if (mRole) {
            if (!message.member.roles.cache.has(mRole.id)) {
              if (message.guild.me.permissions.has("MANAGE_ROLES")) {
                message.member.roles.add(mRole);
              }
              setTimeout(() => {
                Guild.findOne(
                  {
                    guildID: message.guild.id,
                  },
                  (err, Gres) => {
                    if (err) {
                      console.error(err);
                      error.sendError(err);
                      return;
                    }

                    let spam = Gres.spam.filter(
                      (v) => v.userID == message.author.id
                    );

                    if (spam.length > 0) {
                      if (spam[0].mutes == sp.mutes) {
                        if (message.member.roles.cache.has(mRole.id)) {
                          if (
                            message.guild.me.permissions.has("MANAGE_ROLES")
                          ) {
                            message.member.roles.remove(mRole);
                          }
                        }
                      }
                    }
                  }
                );
              }, sp.muteLength * 3600000);
            }
          }

          Guild.findOneAndUpdate(
            {
              guildID: message.guild.id,
              "spam.userID": message.author.id,
            },
            {
              $set: {
                "spam.$.userID": sp.userID,
                "spam.$.curMessCount": sp.curMessCount,
                "spam.$.lastMess": sp.lastMess,
                "spam.$.mutes": sp.mutes,
                "spam.$.muteLength": sp.muteLength,
                "spam.$.lastMesss": sp.lastMesss,
              },
            },
            function (err, res) {
              if (err) {
                console.error(err);
                error.sendError(err);
                return;
              }
            }
          );
        } else if (sp.mutes > 3 && sp.mutes < 7) {
          sp.muteLength = 2;

          let mRole = message.guild.roles.cache.get(Gres.spamMuteRoleID);
          if (mRole) {
            if (!message.member.roles.cache.has(mRole.id)) {
              if (message.guild.me.permissions.has("MANAGE_ROLES")) {
                message.member.roles.add(mRole);
              }
              setTimeout(() => {
                Guild.findOne(
                  {
                    guildID: message.guild.id,
                  },
                  (err, Gres) => {
                    if (err) {
                      console.error(err);
                      error.sendError(err);
                      return;
                    }

                    let spam = Gres.spam.filter(
                      (v) => v.userID == message.author.id
                    );

                    if (spam.length > 0) {
                      if (spam[0].mutes == sp.mutes) {
                        if (message.member.roles.cache.has(mRole.id)) {
                          if (
                            message.guild.me.permissions.has("MANAGE_ROLES")
                          ) {
                            message.member.roles.remove(mRole);
                          }
                        }
                      }
                    }
                  }
                );
              }, sp.muteLength * 3600000);
            }
          }

          Guild.findOneAndUpdate(
            {
              guildID: message.guild.id,
              "spam.userID": message.author.id,
            },
            {
              $set: {
                "spam.$.userID": sp.userID,
                "spam.$.curMessCount": sp.curMessCount,
                "spam.$.lastMess": sp.lastMess,
                "spam.$.mutes": sp.mutes,
                "spam.$.muteLength": sp.muteLength,
                "spam.$.lastMesss": sp.lastMesss,
              },
            },
            function (err, res) {
              if (err) {
                console.error(err);
                error.sendError(err);
                return;
              }
            }
          );
        } else if (sp.mutes >= 7) {
          Guild.findOneAndUpdate(
            { guildID: message.guild.id },
            { $pull: { spam: spam[0] } },
            function (err, res) {
              if (err) {
                console.error(err);
                error.sendError(err);
                return;
              }
            }
          );
          if (message.member.kickable) {
            if (message.guild.me.permissions.has("KICK_MEMBERS")) {
              message.member.kick("Spam.");
            }
          }
        }
      } else {
        Guild.findOneAndUpdate(
          {
            guildID: message.guild.id,
            "spam.userID": message.author.id,
          },
          {
            $set: {
              "spam.$.userID": sp.userID,
              "spam.$.curMessCount": sp.curMessCount,
              "spam.$.lastMess": sp.lastMess,
              "spam.$.mutes": sp.mutes,
              "spam.$.muteLength": sp.muteLength,
              "spam.$.lastMesss": sp.lastMesss,
            },
          },
          function (err, res) {
            if (err) {
              console.error(err);
              error.sendError(err);
              return;
            }
          }
        );
      }
    }
  } else {
    userConst.userID = message.author.id;
    Guild.findOneAndUpdate(
      { guildID: message.guild.id },
      { $push: { spam: userConst } },
      (err, result) => {
        if (err) {
          console.error(err);
          error.sendError(err);
          return;
        }
      }
    );
  }
};

async function delMesss(array) {
  array.forEach(async (e) => {
    var channel = await bot.channels.fetch(e[1]);
    try {
      if (channel.guild.me.permissions.has("MANAGE_MESSAGES")) {
        await channel.messages.delete(e[0]);
      }
    } catch (error) {
      var err = error;
    }
  });
}

const channelCreate = (params) => {
  var channel = params[0];
  if (channel.type == "DM") {
    return;
  }

  Guild.findOne(
    {
      guildID: channel.guild.id,
    },
    (err, Gres) => {
      if (err) {
        console.error(err);
        error.sendError(err);
        return;
      }

      if (Gres) {
        if (Gres.spamEnabled == false) {
          return;
        }

        let mRole = channel.guild.roles.cache.get(Gres.spamMuteRoleID);

        if (mRole) {
          if (channel.guild.me.permissions.has("MANAGE_ROLES")) {
            channel.createOverwrite(
              mRole,
              {
                SEND_MESSAGES: false,
                SEND_TTS_MESSAGES: false,
              },
              "Making Muted role to work here."
            );
          }
        }
      }
    }
  );
};

const channelUpdate = async (params) => {
  var channel = params[0];
  if (channel.type == "DM") {
    return;
  }

  var Gres = Guild.findOne(
    {
      guildID: channel.guild.id,
    },
    (err, Gres) => {
      if (err) {
        console.error(err);
        error.sendError(err);
        return;
      }
      return Gres;
    }
  );

  if (Gres) {
    if (Gres.spamEnabled == false) {
      return;
    }

    var mRole;
    try {
      mRole = await channel.guild.roles.fetch(Gres.spamMuteRoleID);
    } catch (error) {
      return;
    }
    if (mRole) {
      if (channel.permissionsFor(mRole)) {
        if (
          channel.permissionsFor(mRole).has("SEND_MESSAGES") &&
          channel.permissionsFor(mRole).has("SEND_TTS_MESSAGES")
        ) {
          if (channel.guild.me.permissions.has("MANAGE_ROLES")) {
            channel.createOverwrite(
              mRole,
              {
                SEND_MESSAGES: false,
                SEND_TTS_MESSAGES: false,
              },
              "Making Muted role to work here."
            );
          }
        }
      }
    }
  }
};

const guildMemberRemove = (params) => {
  var member = params[0];
  if (member.user == bot.user) return;
  Guild.findOne(
    {
      guildID: member.guild.id,
    },
    (err, Gres) => {
      if (err) {
        console.error(err);
        error.sendError(err);
        return;
      }
      if (!Gres) return;

      let spam = Gres.spam.filter((v) => v.userID == member.id);

      if (spam.length > 0) {
        Guild.findOneAndUpdate(
          {
            guildID: member.guild.id,
          },
          {
            $pull: { spam: spam[0] },
          },
          (err, result) => {
            if (err) {
              console.error(err);
              error.sendError(err);
              return;
            }
          }
        );
      }
    }
  );
};

const roleDelete = (params) => {
  var role = params[0];
  Guild.findOne(
    {
      guildID: role.guild.id,
    },
    (err, Gres) => {
      if (err) {
        console.error(err);
        error.sendError(err);
        return;
      }

      if (Gres) {
        if (Gres.spamEnabled == false) {
          return;
        }

        if ((role.id = Gres.spamMuteRoleID)) {
          Guild.findOneAndUpdate(
            {
              guildID: role.guild.id,
            },
            {
              spamEnabled: false,
              spamMuteRoleID: null,
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
      }
    }
  );
};

const roleUpdate = (params) => {
  var role = params[0];
  Guild.findOne(
    {
      guildID: role.guild.id,
    },
    (err, Gres) => {
      if (err) {
        console.error(err);
        error.sendError(err);
        return;
      }

      if (Gres) {
        if (Gres.spamEnabled == false) {
          return;
        }
        if (role.id == Gres.spamMuteRoleID) {
          if (role.guild.me.permissions.has("MANAGE_ROLES")) {
            role.permissions.remove("SEND_MESSAGES", "SEND_TTS_MESSAGES");
          }
        }
      }
    }
  );
};

module.exports = {
  events: {
    roleUpdate: roleUpdate,
    messageCreate: messageCreate,
    channelCreate: channelCreate,
    channelUpdate: channelUpdate,
    roleDelete: roleDelete,
    guildMemberRemove: guildMemberRemove,
  },
};
