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

const music = require("../music");
const error = require("../../utils/error");
const template = require("string-placeholder");
const Guild = require("../../models/guild");
const voice = require("@discordjs/voice");
const LMessages = require(`../../messages/`);
const { followReply } = require("../../utils/functions");

module.exports = {
  name: "join",
  cooldown: 3,
  aliases: [],
  category: "music",
  async execute(int, serverQueue, Gres) {
    let voiceChannel = int.member.voice.channel;
    if (!voiceChannel) {
      if (int.channel.permissionsFor(int.guild.me).has("SEND_MESSAGES")) {
        followReply(int, { content: LMessages.music.need.toBeInVoice });
      }
      return;
    }
    Guild.findOneAndUpdate(
      {
        guildID: int.guild.id,
      },
      {
        musicBotTxtChannelID: int.channel.id,
      },
      function (err) {
        if (err) {
          console.error(err);
          error.sendError(err);
          return;
        }
      }
    );
    try {
      if (int.guild.me.voice.channel) {
        if (int.guild.me.voice.channel.id == voiceChannel.id) {
          if (int.channel.permissionsFor(int.guild.me).has("SEND_MESSAGES")) {
            followReply(int, {
              content: LMessages.music.otherCmds.alreadyInTheChannel,
            });
          }
        }
        if (int.guild.me.voice.channel.id != voiceChannel.id) {
          if (int.channel.permissionsFor(int.guild.me).has("SEND_MESSAGES")) {
            followReply(int, {
              content: template(
                LMessages.music.otherCmds.joined,
                { voice: voiceChannel.name },
                { before: "%", after: "%" }
              ),
            });
          }
          Guild.findOneAndUpdate(
            {
              guildID: int.guild.id,
            },
            {
              musicBotLoop: false,
              musicBotQueueLoop: false,
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
      } else {
        if (int.channel.permissionsFor(int.guild.me).has("SEND_MESSAGES")) {
          followReply(int, {
            content: template(
              LMessages.music.otherCmds.joined,
              { voice: voiceChannel.name },
              { before: "%", after: "%" }
            ),
          });
        }
        Guild.findOneAndUpdate(
          {
            guildID: int.guild.id,
          },
          {
            musicBotLoop: false,
            musicBotQueueLoop: false,
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
      if (voiceChannel.permissionsFor(int.guild.me).has("CONNECT")) {
        if (!serverQueue) {
          music.queue.set(voiceChannel.guild.id, {
            connection: null,
            songs: [],
          });
          serverQueue = music.queue.get(voiceChannel.guild.id);
        }
        const lastCon = serverQueue.connection;
        if (!lastCon || lastCon.joinConfig.channelId != voiceChannel.id) {
          serverQueue.connection = voice.joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
          });
          music.stateChange(serverQueue, int.guild);
        }
        try {
          await voice.entersState(
            serverQueue.connection,
            voice.VoiceConnectionStatus.Ready,
            10000
          );
        } catch (err) {
          try {
            throw Error(err);
          } catch (err) {
            console.error(err);
            error.sendError(err);
          }
          music.queue.delete(int.guild.id);
          if (int.channel.permissionsFor(int.guild.me).has("SEND_MESSAGES")) {
            followReply(int, { content: LMessages.musicError });
          }
          return;
        }
      }
    } catch (err) {
      console.error(err);
      error.sendError(err);
      music.queue.delete(int.guild.id);

      if (int.channel.permissionsFor(int.guild.me).has("SEND_MESSAGES")) {
        followReply(int, { content: LMessages.musicError });
      }
      return;
    }
  },
};