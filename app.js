import {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js"
import { insertAnswer, insertQuestion } from "./db/functions"
import questions from "./questions"
import express, { json } from "express"
import cors from "cors"
import { passwordCommand, handlePasswordGeneration } from "./passwordGenerator"

require("dotenv").config()

const app = express()
app.use(cors())
app.use(json())

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
})

app.get("/", (req, res) => {
  res.send("Discord bot server is running!")
})

app.listen(process.env.PORT, () => {
  console.log(`Express server running on port ${process.env.PORT}`)
})

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`)
})

// POST endpoint
app.post("/trigger-poll", async (req, res) => {
  console.log("TEH REQUEST FROM THE FRONT END: ", req.body)
  try {
    const testChannelId = req.body.channelId //process.env.CHANNEL_ID
    const channel = await client.channels.fetch(testChannelId)

    if (!channel || !channel.isTextBased()) {
      return res.status(400).json({ error: "Channel not found or invalid!" })
    }

    req.body.questions.forEach((question) => {
      if (question.type === "yes_no") {
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`yes_${question.id}`)
            .setLabel("Yes")
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId(`no_${question.id}`)
            .setLabel("No")
            .setStyle(ButtonStyle.Danger)
        )

        channel.send({
          content: question.question,
          components: [row],
        })
      } else if (question.postType === "multiple_choice") {
        const row = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId(`multiple_choice_${question.question}`)
            .setPlaceholder("Select an option...")
            .addOptions(
              question.options.map((option) => ({
                label: option,
                value: option,
              }))
            )
        )

        channel.send({
          content: question.question,
          components: [row],
        })
      } else if (question.postType === "long_answer") {
        channel.send(
          `${question.question}\n\nPlease reply to this question in the chat.`
        )
      }
    })

    res.json({ success: true })
  } catch (error) {
    console.error("Error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

client.on("interactionCreate", async (interaction) => {
  try {
    if (interaction.isButton()) {
      const response = interaction.customId.split("_")[0].toUpperCase()
      const user = interaction.user.tag
      const answer = response
      console.log(`User ${interaction.user.tag} responded: ${response}`)
      insertAnswer(1, answer, user)
      await interaction.reply({
        content: `You selected: ${response}`,
        ephemeral: true,
      })
    }
  } catch (error) {
    console.error("Error handling interaction:", error)
    if (!interaction.replied) {
      await interaction.reply({
        content: "There was an error processing your interaction.",
        ephemeral: true,
      })
    }
  }
})

client.on("messageCreate", (message) => {
  if (message.author.bot) return
  console.log(`User ${message.author.tag} replied: ${message.content}`)
  message.reply("Thank you for your response!")
})

client.login(process.env.BOT_TOKEN)
