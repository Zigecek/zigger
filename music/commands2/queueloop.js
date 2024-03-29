const Discord = require("discord.js");
const error = require("../../utils/error");
const Guild = require("../../models/guild");
const LMessages = require(`../../messages/`);
const { followReply } = require("../../utils/functions");

module.exports = {
  name: "queueloop",
  cooldown: 2,
  aliases: ["loopqueue"],
  category: "music",
  async execute(int, serverQueue, Gres) {
    if (
      !int.member.voice.channel ||
      int.member.voice.channel != int.guild.members.me.voice.channel
    ) {
      if (
        int.channel
          .permissionsFor(int.guild.members.me)
          .has(Discord.PermissionFlagsBits.SendMessages)
      ) {
        followReply(int, { content: LMessages.music.need.toBeInVoiceWithBot });
      }
    }

    if (!serverQueue) {
      if (
        int.channel
          .permissionsFor(int.guild.members.me)
          .has(Discord.PermissionFlagsBits.SendMessages)
      ) {
        followReply(int, { content: LMessages.musicNothingPlaying });
      }
      return;
    }

    await Guild.updateOne(
      {
        guildID: int.guild.id,
      },
      {
        musicBotQueueLoop: !Gres.musicBotQueueLoop,
      }
    );

    if (Gres.musicBotQueueLoop == true) {
      if (
        int.channel
          .permissionsFor(int.guild.members.me)
          .has(Discord.PermissionFlagsBits.SendMessages)
      ) {
        followReply(int, { content: LMessages.music.loop.queue.disabled });
      }
    } else if (Gres.musicBotQueueLoop == false) {
      if (
        int.channel
          .permissionsFor(int.guild.members.me)
          .has(Discord.PermissionFlagsBits.SendMessages)
      ) {
        followReply(int, { content: LMessages.music.loop.queue.enabled });
      }
    }
  },
};
