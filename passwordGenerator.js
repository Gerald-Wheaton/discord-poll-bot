import { ChatOpenAI } from "@langchain/openai"
import { SlashCommandBuilder } from "@discordjs/builders"
import {
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js"
import { SUS_OR_TRUST_PROMPT as SYSTEM_PROMPT } from "./prompts"

export const passwordCommand = new SlashCommandBuilder()
  .setName("sus-or-trust")
  .setDescription("Analyze a password and count its vulnerabilities")
// .addIntegerOption((option) =>
//   option
//     .setName("vulnerabilities")
//     .setDescription("Maximum number of vulnerabilities to check for (3-5)")
//     .setMinValue(3)
//     .setMaxValue(5)
//     .setRequired(false)
// )

const vulnerabilityCache = new Map()

export async function handlePasswordGeneration(interaction) {
  if (!interaction.isCommand()) return

  await interaction.deferReply({
    flags: [MessageFlags.Ephemeral],
  })

  try {
    const maxVulnerabilities = Math.floor(Math.random() * 5) + 1
    // interaction.options.getInteger("vulnerabilities") || 5

    const chat = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      temperature: 0.8,
      modelName: "gpt-4-turbo-preview",
    })

    const response = await chat.invoke([
      SYSTEM_PROMPT,
      {
        role: "user",
        content: `Generate a password with any number of vulnerabilities up to ${maxVulnerabilities}.`,
      },
    ])

    const cleanedResponse = response.content
      .replace(/```json\n/, "")
      .replace(/\n```$/, "")
      .trim()

    const passwordData = JSON.parse(cleanedResponse)
    const actualVulnerabilities = passwordData.vulnerabilities.length

    const cacheId = `${interaction.id}`
    vulnerabilityCache.set(cacheId, passwordData.vulnerabilities)

    const row = new ActionRowBuilder()
    for (let i = 1; i <= 5; i++) {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`vulnGuess_${i}_${actualVulnerabilities}_${cacheId}`)
          .setLabel(i.toString())
          .setStyle(ButtonStyle.Primary)
      )
    }

    await interaction.editReply({
      content: `🔑 Here's a password: \`${passwordData.password}\`\n\nHow many vulnerabilities do you think this password has?`,
      components: [row],
      flags: [MessageFlags.Ephemeral],
    })
  } catch (error) {
    console.error("Error:", error)
    await interaction.editReply({
      content: "Sorry, there was an error generating the password.",
      flags: [MessageFlags.Ephemeral],
    })
  }
}

export async function handleVulnerabilityGuess(interaction) {
  if (!interaction.isButton()) return

  if (interaction.customId.startsWith("vulnGuess_")) {
    const [_, guessedCount, actualCount, cacheId] =
      interaction.customId.split("_")
    const vulnerabilities = vulnerabilityCache.get(cacheId)

    // Clean up the cache
    vulnerabilityCache.delete(cacheId)

    const password = interaction.message.content.match(/`([^`]+)`/)[1] //pulls the original password string from the Discord Message
    const isCorrect = Number(guessedCount) === Number(actualCount)

    if (isCorrect) {
      await interaction.update({
        content: `✅ That's correct! There were ${actualCount} vulnerabilities.`,
        components: [],
        flags: [MessageFlags.Ephemeral],
      })
    } else {
      let response = `❌ That's incorrect. There were actually ${actualCount} vulnerabilities.\n\nHere are all the vulnerabilities in \`${password}\`:\n`

      vulnerabilities.forEach((vulnerability) => {
        response += `• ${vulnerability}\n`
      })

      await interaction.update({
        content: response,
        components: [],
        flags: [MessageFlags.Ephemeral],
      })
    }
  }
}
