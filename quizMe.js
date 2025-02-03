import {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  EmbedBuilder,
  SlashCommandBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} from "discord.js"
import { quiz as QUIZ } from "./questions"
const instructions =
  "When you're ready to take this quiz, smahsshh that button below\n\n"

const quizBuilderCommand = new SlashCommandBuilder()
  .setName("quiz-me")
  .setDescription("Take a quiz about some random stuph")

async function handleOpenQuizMe(interaction) {
  if (!interaction.isCommand()) return

  await interaction.deferReply({
    flags: [MessageFlags.Ephemeral],
  })

  const row = new ActionRowBuilder()
  row.addComponents(
    new ButtonBuilder()
      .setCustomId(`quizme_${interaction.id}`)
      .setLabel("Let me at 'em")
      .setStyle(ButtonStyle.Primary)
  )

  await interaction.editReply({
    content: `${instructions}`,
    components: [row],
    flags: [MessageFlags.Ephemeral],
  })
}

async function handleQuizMe(interaction) {
  if (QUIZ.type === "input") {
    const modal = new ModalBuilder({
      customId: `modalPoll_${QUIZ.title}`,
      title: "Poll Modal",
    })
    QUIZ.questions.forEach((question, index) => {
      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId(`modalPoll_input_${index}`)
            .setLabel(question.question)
            .setStyle(
              question.type === "short_answer"
                ? TextInputStyle.Short
                : TextInputStyle.Paragraph
            )
        )
      )
    })
    await interaction.showModal(modal)
  } else if (QUIZ.type === "clickable") {
    console.log("Handling quiz interaction...")

    const rows = QUIZ.questions.flatMap((question, qIndex) => [
      // hack to get row title = put label/title in diabled button
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`buttonPoll_label_${qIndex}`)
          .setLabel(question.question)
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true)
      ),
      new ActionRowBuilder().addComponents(
        ...question.options.map((option, oIndex) =>
          new ButtonBuilder()
            .setCustomId(`buttonPoll_${option}_${QUIZ.title}`)
            .setLabel(option)
            .setStyle(ButtonStyle.Success)
        )
      ),
    ])

    await interaction.reply({
      content: `Get ready for the **quiziest** quiz you've taken`,
      components: rows,
      flags: [MessageFlags.Ephemeral],
    })
  } else {
    console.log("NOTHING TO REPORT HERE")
  }
}

export { quizBuilderCommand, handleOpenQuizMe, handleQuizMe }
