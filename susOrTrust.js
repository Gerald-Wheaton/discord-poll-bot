import { ChatOpenAI } from "@langchain/openai"
import { SlashCommandBuilder } from "@discordjs/builders"
import {
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js"
import { SUS_OR_TRUST } from "./prompts"
import UpdateBubble from "./bubbleUpdate"
// import UpdateBubble from "./bubbleUpdate"

const sotCache = new Map()

const susOrTrustCommand = new SlashCommandBuilder()
  .setName("sus-or-trust")
  .setDescription("Determine if the password is Susworthy or Trustworthy")

async function handleSusOrTrustGeneration(interaction) {
  if (!interaction.isCommand()) return

  await interaction.deferReply({
    flags: [MessageFlags.Ephemeral],
  })

  try {
    const chat = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      temperature: 0.8,
      modelName: "gpt-4-turbo-preview",
    })

    const response = await chat.invoke([
      SUS_OR_TRUST,
      {
        role: "user",
        content: `Generate a password that is vulnerable or trustworthy (sus or trust)`,
      },
    ])

    const cleanedResponse = response.content
      .replace(/```json\n/, "")
      .replace(/\n```$/, "")
      .trim()

    const passwordData = JSON.parse(cleanedResponse)
    const cacheId = interaction.id
    sotCache.set(cacheId, {
      password: passwordData.password,
      type: passwordData.type,
      explanation: passwordData.explanation,
    })

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`sot_sus_${cacheId}`)
        .setLabel("Sus")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`sot_trust_${cacheId}`)
        .setLabel("Trust")
        .setStyle(ButtonStyle.Success)
    )

    await interaction.editReply({
      content: `Determine whether the password is weak (Sus 👀), or Strong (Trust 🔒)💪💪!\nthe password: **\`${passwordData.password}\`**`,
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

async function handleSusOrTrustGuess(interaction) {
  if (!interaction.isButton()) return
  if (interaction.customId.startsWith("sot_")) {
    const [_, buttonType, originalInteractionId] =
      interaction.customId.split("_")
    const cachedData = sotCache.get(originalInteractionId)

    const isCorrect =
      buttonType.toLowerCase() === cachedData?.type.toLowerCase()

    UpdateBubble(interaction.user.tag, "Sus or Trust", interaction.id)

    if (isCorrect) {
      await interaction.update({
        content: `✅ That's correct! The password **\`${
          cachedData.password
        }\`** is indeed ${cachedData.type.toUpperCase()}!\n${
          cachedData.explanation
        }`,
        components: [],
        flags: [MessageFlags.Ephemeral],
      })
    } else {
      await interaction.update({
        content: `❌ That's incorrect. The password  **\`${
          cachedData.password
        }\`** is actually ${cachedData.type.toUpperCase()}!\n${
          cachedData.explanation
        }`,
        components: [],
        flags: [MessageFlags.Ephemeral],
      })
    }

    sotCache.delete(originalInteractionId)
  }
}

export { susOrTrustCommand, handleSusOrTrustGeneration, handleSusOrTrustGuess }
