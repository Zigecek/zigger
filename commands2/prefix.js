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

const Guild = require("../models/guild.js");
const template = require("string-placeholder");
const error = require("../utils/error");
const { followReply } = require("../utils/functions");
const LMessages = require(`../messages/`);

module.exports = {
  name: "prefix",
  cooldown: 2,
  aliases: [],
  category: "settings",
  async execute(int, serverQueue, Gres) {
    if (int.member.permissions.has("ADMINISTRATOR")) {
      if (int.options.getSubcommand() == "info") {
        followReply(int, {
          content: template(
            LMessages.prefix.info,
            { prefix: Gres.prefix },
            { before: "%", after: "%" }
          ),
        });
      } else if (int.options.getSubcommand() == "set") {
        Guild.findOneAndUpdate(
          {
            guildID: int.guild.id,
          },
          {
            prefix: int.options.get("prefix").value,
          },
          function (err) {
            if (err) {
              console.error(err);
              error.sendError(err);
              return;
            }

            followReply(int, {
              content: template(
                LMessages.prefix.set,
                {
                  guild: Gres.guildName,
                  prefix: int.options.get("prefix").value,
                },
                { before: "%", after: "%" }
              ),
            });
          }
        );
      }
    } else {
      followReply(int, { content: LMessages.noPermission });
    }
  },
};