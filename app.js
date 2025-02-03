import { Client, GatewayIntentBits, MessageFlags } from "discord.js"
import express, { json } from "express"
import cors from "cors"
import {
  handlePasswordGeneration,
  handleVulnerabilityGuess,
  handleVulnerabilityListSubmission,
} from "./sneakinOrTweakin"
import { handleSusOrTrustGeneration, handleSusOrTrustGuess } from "./susOrTrust"
import { handleQuizMe, handleOpenQuizMe } from "./quizMe"
import UpdateBubble from "./bubbleUpdate"

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

const TEST_QUIZ = {
  type: "input",
  title: "Science Quiz",
  questions: [
    {
      type: "long_answer",
      question: "Explain how gravity works in your own words.",
    },
    {
      type: "short_answer",
      question: "What is the capital of France?",
    },
  ],
}

app.get("/", (req, res) => {
  res.send("Discord bot server is running!")
})

app.listen(process.env.PORT, () => {
  console.log(`Express server running on port ${process.env.PORT}`)
})

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`)
})

client.on("interactionCreate", async (interaction) => {
  // -- Sneakin or Tweakin --
  if (interaction.commandName === "sneakin-or-tweakin") {
    await handlePasswordGeneration(interaction)
  } else if (
    interaction.isButton() &&
    interaction.customId.startsWith(`vulnGuess_`)
  ) {
    await handleVulnerabilityGuess(interaction)
  } else if (
    interaction.isModalSubmit() &&
    interaction.customId.startsWith("vulnListModal_")
  ) {
    await handleVulnerabilityListSubmission(interaction)
  }
  // -- Sus or trust --
  else if (interaction.commandName === "sus-or-trust") {
    await handleSusOrTrustGeneration(interaction)
  } else if (
    interaction.isButton() &&
    interaction.customId.startsWith(`sot_`)
  ) {
    await handleSusOrTrustGuess(interaction)
  }
  // -- Quiz Builder --
  else if (interaction.commandName === "quiz-me") {
    await handleOpenQuizMe(interaction)
  } else if (
    interaction.isButton() &&
    interaction.customId.startsWith("quizme_")
  ) {
    await handleQuizMe(interaction)
  } else if (
    interaction.isButton() &&
    interaction.customId.startsWith("buttonPoll_")
  ) {
    const [_, option, poll_title] = interaction.customId.split("_")

    await UpdateBubble(interaction.user.tag, poll_title, interaction.id)
  } else if (
    interaction.isModalSubmit() &&
    interaction.customId.startsWith("modalPoll_")
  ) {
    const [_, poll_title] = interaction.customId.split("_")

    await UpdateBubble(interaction.user.tag, poll_title, interaction.id)

    await interaction.reply({
      content: "✅ Your answers have been submitted successfully!",
      flags: [MessageFlags.Ephemeral], // The response is only visible to the user
    })
  }
})

client.login(process.env.BOT_TOKEN)
