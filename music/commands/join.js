const Discord = require("discord.js");
const music = require("../music");
const error = require("../../utils/error");
const template = require("string-placeholder");
const Guild = require("../../models/guild");
const voice = require("@discordjs/voice");
const LMessages = require(`../../messages/`);

module.exports = {
  name: "join",
  cooldown: 3,
  aliases: [],
  category: "music",
  async execute(message, serverQueue, args, Gres, prefix, command, isFS) {
    let voiceChannel = message.member.voice.channel;
    if (!voiceChannel) {
      if (
        message.channel
          .permissionsFor(message.guild.members.me)
          .has(Discord.PermissionFlagsBits.SendMessages)
      ) {
        message.channel.send(LMessages.music.need.toBeInVoice);
      }
      return;
    }
    await Guild.updateOne(
      {
        guildID: message.guild.id,
      },
      {
        musicBotTxtChannelID: message.channel.id,
      }
    );
    try {
      if (message.guild.members.me.voice.channel) {
        if (message.guild.members.me.voice.channel.id == voiceChannel.id) {
          if (
            message.channel
              .permissionsFor(message.guild.members.me)
              .has(Discord.PermissionFlagsBits.SendMessages)
          ) {
            message.channel.send(LMessages.music.otherCmds.alreadyInTheChannel);
          }
        }
        if (message.guild.members.me.voice.channel.id != voiceChannel.id) {
          if (
            message.channel
              .permissionsFor(message.guild.members.me)
              .has(Discord.PermissionFlagsBits.SendMessages)
          ) {
            message.channel.send(
              template(
                LMessages.music.otherCmds.joined,
                { voice: voiceChannel.name },
                { before: "%", after: "%" }
              )
            );
          }
          await Guild.updateOne(
            {
              guildID: message.guild.id,
            },
            {
              musicBotLoop: false,
              musicBotQueueLoop: false,
            }
          );
        }
      } else {
        if (
          message.channel
            .permissionsFor(message.guild.members.me)
            .has(Discord.PermissionFlagsBits.SendMessages)
        ) {
          message.channel.send(
            template(
              LMessages.music.otherCmds.joined,
              { voice: voiceChannel.name },
              { before: "%", after: "%" }
            )
          );
        }
        await Guild.updateOne(
          {
            guildID: message.guild.id,
          },
          {
            musicBotLoop: false,
            musicBotQueueLoop: false,
          }
        );
      }
      if (
        voiceChannel
          .permissionsFor(message.guild.members.me)
          .has(Discord.PermissionFlagsBits.ManageRoles)
      ) {
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
          music.stateChange(serverQueue, message.guild);
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
          music.queue.delete(message.guild.id);
          if (
            message.channel
              .permissionsFor(message.guild.members.me)
              .has(Discord.PermissionFlagsBits.SendMessages)
          ) {
            message.channel.send(LMessages.musicError);
          }
          return;
        }
      }
    } catch (err) {
      console.error(err);
      error.sendError(err);
      music.queue.delete(message.guild.id);

      if (
        message.channel
          .permissionsFor(message.guild.members.me)
          .has(Discord.PermissionFlagsBits.SendMessages)
      ) {
        message.channel.send(LMessages.musicError);
      }
      return;
    }
  },
};
