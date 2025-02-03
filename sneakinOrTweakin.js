import { ChatOpenAI } from "@langchain/openai"
import { SlashCommandBuilder } from "@discordjs/builders"
import {
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js"
import {
  SPOT_THE_VULNERABILITY,
  SPOT_THE_VULNERABILITY_LIST_CHECK,
} from "./prompts"

const sneakinOrTweakin = new SlashCommandBuilder()
  .setName("sneakin-or-tweakin")
  .setDescription(
    "Find the number of vulnerabilities in this password. Is it Sneakin' by or Tweakin', and hackable?"
  )

const vulnerabilityCache = new Map()

async function handlePasswordGeneration(interaction) {
  if (!interaction.isCommand()) return

  await interaction.deferReply({
    flags: [MessageFlags.Ephemeral],
  })

  try {
    const maxVulnerabilities = Math.floor(Math.random() * 5) + 1

    const chat = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      temperature: 0.8,
      modelName: "gpt-4-turbo-preview",
    })

    const response = await chat.invoke([
      SPOT_THE_VULNERABILITY,
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

    let timeLeft = 10
    await interaction.editReply({
      content: `🔑 Here's a password: \`${passwordData.password}\`\n\n⏱️ Time remaining: **${timeLeft}** seconds\n\nHow many vulnerabilities do you think this password has?`,
      components: [row],
      flags: [MessageFlags.Ephemeral],
    })
    const timer = setInterval(async () => {
      timeLeft--
      if (timeLeft > 0) {
        try {
          await interaction.editReply({
            content: `🔑 Here's a password: \`${passwordData.password}\`\n\n⏱️ Time remaining: **${timeLeft}** seconds\n\nHow many vulnerabilities do you think this password has?`,
            components: [row],
            flags: [MessageFlags.Ephemeral],
          })
        } catch (error) {
          clearInterval(timer)
        }
      } else {
        // Time's up
        clearInterval(timer)
        const response = `⏰ **Time's up!** There were ${actualVulnerabilities} vulnerabilities in the password \`${
          passwordData.password
        }\`.\n\n__Here are all the vulnerabilities:__\n${passwordData.vulnerabilities
          .map((v) => `• ${v}`)
          .join("\n")}`

        await interaction.editReply({
          content: response,
          components: [], // Remove the buttons
          flags: [MessageFlags.Ephemeral],
        })

        // Clean up the cache
        vulnerabilityCache.delete(cacheId)
      }
    }, 1000)

    vulnerabilityCache.set(`timer_${cacheId}`, timer)
  } catch (error) {
    console.error("Error:", error)
    await interaction.editReply({
      content:
        "Sorry, there was an error generating the password please try again.",
      flags: [MessageFlags.Ephemeral],
    })
  }
}

async function handleVulnerabilityGuess(interaction) {
  if (!interaction.isButton()) return

  if (interaction.customId.startsWith("vulnGuess_")) {
    const [_, guessedCount, actualCount, cacheId] =
      interaction.customId.split("_")

    const timer = vulnerabilityCache.get(`timer_${cacheId}`)
    if (timer) {
      clearInterval(timer)
      vulnerabilityCache.delete(`timer_${cacheId}`)
    }

    const vulnerabilities = vulnerabilityCache.get(cacheId)

    if (!vulnerabilities) {
      await interaction.update({
        content: "⏰ This question has expired.",
        components: [],
        flags: [MessageFlags.Ephemeral],
      })
      return
    }

    const password = interaction.message.content.match(/`([^`]+)`/)[1] //pulls the original password string from the Discord Message
    const isCorrect = Number(guessedCount) === Number(actualCount)

    if (isCorrect) {
      // await interaction.update({
      //   content: `✅ That's correct! There were ${actualCount} vulnerabilities.`,
      //   components: [],
      //   flags: [MessageFlags.Ephemeral],
      // })

      const modal = new ModalBuilder()
        .setCustomId(`vulnListModal_${cacheId}`)
        .setTitle("List the Vulnerabilities")

      const input = new TextInputBuilder()
        .setCustomId("vulnerability_list")
        .setLabel(`List the ${actualCount} vulnerabilities you found`)
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)

      const row = new ActionRowBuilder().addComponents(input)
      modal.addComponents(row)

      await interaction.showModal(modal)
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

async function handleVulnerabilityListSubmission(interaction) {
  const [_, cacheId] = interaction.customId.split("_")
  const vulnerabilities = vulnerabilityCache.get(cacheId)

  if (!vulnerabilities) {
    await interaction.reply({
      content: "There was an issue with retrieving the vulnerabilities.",
      flags: [MessageFlags.Ephemeral],
    })
    return
  }

  const userResponse =
    interaction.fields.getTextInputValue("vulnerability_list")

  const chat = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    temperature: 0.7,
    modelName: "gpt-4-turbo",
  })

  const response = await chat.invoke([
    SPOT_THE_VULNERABILITY_LIST_CHECK,
    {
      role: "user",
      content: `Given the following password vulnerabilities:

  Actual vulnerabilities:
  ${vulnerabilities.join("\n")}

  User's submission:
  ${userResponse}

  Compare the two and return a JSON response in the following format:
  {
    "numCorrect": number,
    "answersMissed": ["string1", "string2", ...]
  }
`,
    },
  ])

  const cleanedResponse = response.content
    .replace(/\\n/g, "")
    .replace(/\s+/g, "")

  let result
  try {
    result = JSON.parse(cleanedResponse)
  } catch (error) {
    console.error("Error parsing response:", error)
    await interaction.reply({
      content: "There was an error processing the comparison.",
      ephemeral: true,
    })
    return
  }

  const numCorrect = result.numCorrect
  const answersMissed = result.answersMissed

  let replyContent
  if (numCorrect === vulnerabilities.length) {
    replyContent = `🎉 Great job! You correctly listed all vulnerabilities:\n${vulnerabilities
      .map((v) => `• ${v}`)
      .join("\n")}`
  } else {
    replyContent = `🔍 You got ${numCorrect}/${
      vulnerabilities.length
    } correct. Here’s the full list:\n${vulnerabilities
      .map((v) => `• ${v}`)
      .join("\n")}`
  }

  await interaction.update({
    content: replyContent,
    components: [],
    flags: [MessageFlags.Ephemeral],
  })
  vulnerabilityCache.delete(cacheId)
}

export {
  sneakinOrTweakin,
  handlePasswordGeneration,
  handleVulnerabilityGuess,
  handleVulnerabilityListSubmission,
}
