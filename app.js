const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
} = require("discord.js")
require("dotenv").config()

const questions = require("./questions")

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
})

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`)
})

// Text command: !ask
client.on("messageCreate", (message) => {
  if (message.content === "!ask") {
    questions.forEach((question) => {
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

        message.channel.send({
          content: question.text,
          components: [row],
        })
      } else if (question.type === "multiple_choice") {
        const row = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId(`multiple_choice_${question.id}`)
            .setPlaceholder("Select an option...")
            .addOptions(
              question.options.map((option, index) => ({
                label: option,
                value: option, // Use the option text as the value
              }))
            )
        )

        message.channel.send({
          content: question.text,
          components: [row],
        })
      } else if (question.type === "long_answer") {
        message.channel.send(
          `${question.text}\n\nPlease reply to this question in the chat.`
        )
      }
    })
  }
})

// Slash command: /ask
client.on("interactionCreate", async (interaction) => {
  if (interaction.isCommand()) {
    const { commandName } = interaction

    if (commandName === "ask") {
      for (const question of questions) {
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

          await interaction.channel.send({
            content: question.text,
            components: [row],
          })
        } else if (question.type === "multiple_choice") {
          const row = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
              .setCustomId(`multiple_choice_${question.id}`)
              .setPlaceholder("Select an option...")
              .addOptions(
                question.options.map((option, index) => ({
                  label: option,
                  value: option, // Use the option text as the value
                }))
              )
          )

          await interaction.channel.send({
            content: question.text,
            components: [row],
          })
        } else if (question.type === "long_answer") {
          await interaction.channel.send(
            `${question.text}\n\nPlease reply to this question in the chat.`
          )
        }
      }

      await interaction.reply({
        content: "Questions have been posted!",
        ephemeral: true,
      })
    }
  }

  // Handle button and select menu interactions
  if (interaction.isButton() || interaction.isStringSelectMenu()) {
    try {
      if (interaction.isButton()) {
        // Log Yes/No response
        const response = interaction.customId.split("_")[0].toUpperCase()
        console.log(`User ${interaction.user.tag} responded: ${response}`)
        await interaction.reply({
          content: `You selected: ${response}`,
          ephemeral: true,
        })
      } else if (interaction.isStringSelectMenu()) {
        // Log Multiple Choice response
        const response = interaction.values[0]
        console.log(`User ${interaction.user.tag} selected: ${response}`)
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
  }
})

// Long answer responses
client.on("messageCreate", (message) => {
  // Skip if the message is from the bot itself
  if (message.author.bot) return

  // Detect long answer responses
  console.log(`User ${message.author.tag} replied: ${message.content}`)
  message.reply("Thank you for your response!")
})

client.login(process.env.BOT_TOKEN)
