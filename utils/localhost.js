const Discord = require("discord.js");
const bodyParser = require("body-parser");
const express = require("express");
const Config = require("../models/Config");
const { bot } = require("../bot");
const config = require("../config");
const sec2human = require("sec2human");

const port = config.index == 1 ? 3321 : 3322;
const app = express();

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", function (req, res, next) {
  res.sendStatus(200);
});

app.post("/toAdmin", async function (req, res) {
  var Gres = await Config.findOne({
    number: 1,
  });
  const user = await bot.users.fetch(Gres.botAdminDiscordID[0]);

  switch (req.body.event) {
    case "PrintDone":
      user.send({
        embeds: [
          new Discord.EmbedBuilder()
            .setTitle(req.body.event)
            .setDescription(
              `${req.body.data.file} - ${sec2human(
                Math.floor(req.body.data.time)
              )}`
            )
            .setImage(req.body.data.image)
            .setTimestamp(),
        ],
      });
      break;
    case "PrintStarted":
      user.send({
        embeds: [
          new Discord.EmbedBuilder()
            .setTitle(req.body.event)
            .setDescription(`${req.body.data.file}`)
            .setTimestamp(),
        ],
      });
      break;
    case "PrintFailed":
      user.send({
        embeds: [
          new Discord.EmbedBuilder()
            .setTitle(req.body.event)
            .setDescription(
              `${req.body.data.file} - ${
                req.body.data.cancelled ? "Cancelled" : "Due to error"
              }`
            )
            .setTimestamp(),
        ],
      });
      break;
  }

  res.sendStatus(200);
});

app.listen(port);
