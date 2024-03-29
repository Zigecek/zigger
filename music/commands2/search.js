const Discord = require("discord.js");
const ytsr = require("ytsr");
const { bot } = require("../../bot");
const music = require("../music");
const error = require("../../utils/error");
var decode = require("ent/decode");
const template = require("string-placeholder");
const { parseTimestamp } = require("m3u8stream");
const Guild = require("../../models/guild");
const config = require("../../config.js");
const voice = require("@discordjs/voice");
const LMessages = require(`../../messages/`);
const { followReply } = require("../../utils/functions");
const short = require("short-uuid");

module.exports = {
  name: "search",
  cooldown: 3,
  aliases: [],
  category: "music",
  execute(int, serverQueue, Gres) {
    if (
      !int.channel
        .permissionsFor(int.guild.members.me)
        .has(Discord.PermissionFlagsBits.SendMessages)
    )
      return;
    const voiceChannel = int.member.voice.channel;
    if (!voiceChannel) {
      if (
        int.channel
          .permissionsFor(int.guild.members.me)
          .has(Discord.PermissionFlagsBits.SendMessages)
      ) {
        followReply(int, { content: LMessages.music.need.toBeInVoice });
      }
      return;
    }
    const permissions = voiceChannel.permissionsFor(int.client.user);
    if (
      !permissions.has(Discord.PermissionFlagsBits.ManageRoles) ||
      !permissions.has(Discord.PermissionFlagsBits.Speak)
    ) {
      if (
        int.channel
          .permissionsFor(int.guild.members.me)
          .has(Discord.PermissionFlagsBits.SendMessages)
      ) {
        followReply(int, { content: LMessages.musicBotHasNoPermission });
      }
      return;
    }
    if (int.guild.members.me.voice.channel) {
      if (Gres.musicBotPlaying) {
        if (
          int.guild.members.me.voice.channel.id != int.member.voice.channel.id
        ) {
          if (
            int.channel
              .permissionsFor(int.guild.members.me)
              .has(Discord.PermissionFlagsBits.SendMessages)
          ) {
            followReply(int, { content: LMessages.music.botIsPlaying });
          }
          return;
        }
      }
    }

    if (
      !int.channel
        .permissionsFor(int.guild.members.me)
        .has(Discord.PermissionFlagsBits.SendMessages)
    ) {
      return;
    }

    console.log("fafas");
    followReply(int, {
      content: template(
        LMessages.musicSearching,
        { query: int.options.get("query").value },
        { before: "%", after: "%" }
      ),
    });

    ytsr(int.options.get("query").value, {
      limit: 30,
      filter: "audioonly",
      quality: "highestaudio",
      highWaterMark: 10485760,
      requestOptions: {
        headers: {
          cookie: "",
        },
      },
    }).then(async (result) => {
      const tracks = result.items.filter((x) => x.type == "video").slice(0, 10);
      if (!tracks) {
        if (
          int.channel
            .permissionsFor(int.guild.members.me)
            .has(Discord.PermissionFlagsBits.SendMessages)
        ) {
          followReply(int, { content: LMessages.musicNothingFound });
        }
        return;
      }
      let i = 0;
      var tracksInfo =
        "```\n" +
        tracks.map((track) => `\n${++i}. ${decode(track.title)}`) +
        "\n```";
      if (
        int.channel
          .permissionsFor(int.guild.members.me)
          .has(Discord.PermissionFlagsBits.SendMessages)
      ) {
        const row = new Discord.ActionRowBuilder().setComponents([
          new Discord.ButtonBuilder()
            .setCustomId("1")
            .setLabel("1")
            .setStyle(Discord.ButtonStyle.Primary),
          new Discord.ButtonBuilder()
            .setCustomId("2")
            .setLabel("2")
            .setStyle(Discord.ButtonStyle.Primary),
          new Discord.ButtonBuilder()
            .setCustomId("3")
            .setLabel("3")
            .setStyle(Discord.ButtonStyle.Primary),
          new Discord.ButtonBuilder()
            .setCustomId("4")
            .setLabel("4")
            .setStyle(Discord.ButtonStyle.Primary),
          new Discord.ButtonBuilder()
            .setCustomId("5")
            .setLabel("5")
            .setStyle(Discord.ButtonStyle.Primary),
        ]);
        const row2 = new Discord.ActionRowBuilder().setComponents([
          new Discord.ButtonBuilder()
            .setCustomId("6")
            .setLabel("6")
            .setStyle(Discord.ButtonStyle.Primary),
          new Discord.ButtonBuilder()
            .setCustomId("7")
            .setLabel("7")
            .setStyle(Discord.ButtonStyle.Primary),
          new Discord.ButtonBuilder()
            .setCustomId("8")
            .setLabel("8")
            .setStyle(Discord.ButtonStyle.Primary),
          new Discord.ButtonBuilder()
            .setCustomId("9")
            .setLabel("9")
            .setStyle(Discord.ButtonStyle.Primary),
          new Discord.ButtonBuilder()
            .setCustomId("10")
            .setLabel("10")
            .setStyle(Discord.ButtonStyle.Primary),
        ]);
        var smessage = await followReply(int, {
          content: template(
            LMessages.musicSearch,
            { tracks: tracksInfo },
            { before: "%", after: "%" }
          ),
          components: [row, row2],
        });
        const filter = (inter) => inter.member.id == int.member.id;
        if (smessage) {
          const collector = smessage
            .createMessageComponentCollector({ filter, time: 30_000 })
            .on("collect", (interact) => {
              if (!interact.isButton()) return;
              var id = Number(interact.component.customId);
              Discord.ButtonBuilder.from(interact.component).setStyle(Discord.ButtonStyle.Danger);
              interact.message.components.forEach((row) => {
                row.components.forEach((butt) => {
                  Discord.ButtonBuilder.from(butt).setDisabled();
                });
              });

              if (id == 1) {
                rSearch(0, int, tracks, collector);
              } else if (id == 2) {
                rSearch(1, int, tracks, collector);
              } else if (id == 3) {
                rSearch(2, int, tracks, collector);
              } else if (id == 4) {
                rSearch(3, int, tracks, collector);
              } else if (id == 5) {
                rSearch(4, int, tracks, collector);
              } else if (id == 6) {
                rSearch(5, int, tracks, collector);
              } else if (id == 7) {
                rSearch(6, int, tracks, collector);
              } else if (id == 8) {
                rSearch(7, int, tracks, collector);
              } else if (id == 9) {
                rSearch(8, int, tracks, collector);
              } else if (id == 10) {
                rSearch(9, int, tracks, collector);
              } else {
                collector.stop();
                return;
              }
            })
            .on("end", () => {
              if (smessage) {
                if (smessage.deletable) {
                  if (
                    int.guild.members.me.permissions.has(
                      Discord.PermissionFlagsBits.ManageMessages
                    )
                  ) {
                    smessage.delete();
                  }
                }
              }
            });
        }
        async function rSearch(index, int, tracks, collector) {
          collector.stop();
          const voiceChannel = int.member.voice.channel;

          let song = {
            title: tracks[index].title,
            url: tracks[index].url,
            author: tracks[index].author.name,
            duration: tracks[index].isLive ? "LIVE!" : tracks[index].duration,
            sDur: tracks[index].isLive
              ? "LIVE!"
              : Math.floor(parseTimestamp(tracks[index].duration) / 1000),
            thumbnail: tracks[index].thumbnails.pop().url,
            seek: null,
            uuid: short.generate(),
          };
          await Guild.updateOne(
            {
              guildID: int.guild.id,
            },
            {
              musicBotTxtChannelID: int.channel.id,
              musicBotPaused: false,
            }
          );

          let queueConstructor = {
            connection: null,
            songs: [],
          };

          if (!serverQueue) {
            queueConstructor.songs.push(song);
            music.queue.set(int.guild.id, queueConstructor);
            serverQueue = music.queue.get(int.guild.id);

            try {
              if (int.guild.members.me.voice.channel) {
                if (int.guild.members.me.voice.channel.id != voiceChannel.id) {
                  followReply(int, {
                    content: template(
                      LMessages.music.otherCmds.joined,
                      { voice: voiceChannel.name },
                      { before: "%", after: "%" }
                    ),
                  });
                  await Guild.updateOne(
                    {
                      guildID: int.guild.id,
                    },
                    {
                      musicBotLoop: false,
                      musicBotQueueLoop: false,
                    }
                  );
                }
              } else {
                followReply(int, {
                  content: template(
                    LMessages.music.otherCmds.joined,
                    { voice: voiceChannel.name },
                    { before: "%", after: "%" }
                  ),
                });
                await Guild.updateOne(
                  {
                    guildID: int.guild.id,
                  },
                  {
                    musicBotLoop: false,
                    musicBotQueueLoop: false,
                  }
                );
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

              music.play(int.guild, serverQueue.songs[0], false);

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
                if (
                  int.channel
                    .permissionsFor(int.guild.members.me)
                    .has(Discord.PermissionFlagsBits.SendMessages)
                ) {
                  followReply(int, { content: LMessages.musicError });
                }
                return;
              }
            } catch (err) {
              console.error(err);
              error.sendError(err);
              music.queue.delete(int.guild.id);

              followReply(int, { content: LMessages.musicError });
              return;
            }
          } else {
            serverQueue.songs.push(song);

            if (Gres.annouce == 1) {
              const Embed = new Discord.EmbedBuilder()
                .setColor(config.colors.red)
                .setTitle(LMessages.musicSongAddToQueue)
                .setThumbnail(song.thumbnail)
                .addFields(
                  {
                    name: LMessages.musicName,
                    value: `[${song.title}](${song.url})`,
                  },
                  {
                    name: LMessages.musicDuration,
                    value: song.duration,
                  }
                );

              if (
                int.channel
                  .permissionsFor(int.guild.members.me)
                  .has(Discord.PermissionFlagsBits.SendMessages)
              ) {
                if (
                  int.guild.members.me.permissions.has(
                    Discord.PermissionFlagsBits.EmbedLinks
                  )
                ) {
                  followReply(int, { embeds: [Embed] });
                } else {
                  followReply(int, {
                    content:
                      "**" +
                      LMessages.musicSongAddToQueue +
                      "** " +
                      "`" +
                      song.title +
                      "` **`(" +
                      song.duration +
                      ")`**",
                  });
                }
              }
            } else if (Gres.annouce == 0) {
              return;
            } else if (Gres.annouce == 3) {
              followReply(int, {
                content:
                  "**" +
                  LMessages.musicSongAddToQueue +
                  "** " +
                  "`" +
                  song.title +
                  "` **`(" +
                  song.duration +
                  ")`**",
              });
            }
          }
        }
      }
    });
  },
};
