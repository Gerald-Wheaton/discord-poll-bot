import { SlashCommandBuilder } from "@discordjs/builders"
import { OpenAI } from "@langchain/openai"
import dotenv from "dotenv"
import { SUS_OR_TRUST_PROMPT } from "./prompts.js"

dotenv.config()

// Add this to your existing command registration
const generatePasswordCommand = new SlashCommandBuilder()
  .setName("sus-or-trust")
  .setDescription("Generate an intentionally vulnerable password.")

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return

  if (interaction.commandName === "generate-bad-password") {
    await interaction.deferReply() // Since this might take a moment

    try {
      const llm = new OpenAI({
        openAIApiKey: process.env.OPENAI_API_KEY,
        temperature: 0.8, // Some creativity but not too random
        model: "gpt-4-turbo-preview", // Or your preferred model
      })

      const response = await llm.predict(SUS_OR_TRUST_PROMPT)

      // Parse the JSON response
      const passwordData = JSON.parse(response)

      // Create a formatted Discord message
      const formattedResponse = `🔑 Generated Password: \`${
        passwordData.password
      }\`\n\n⚠️ Vulnerabilities Found:\n${passwordData.vulnerabilities
        .map((v) => `• ${v}`)
        .join(
          "\n"
        )}\n\n⚡ Remember: This is an example of how NOT to create passwords!`

      await interaction.editReply(formattedResponse)
    } catch (error) {
      console.error("Error:", error)
      await interaction.editReply(
        "Sorry, there was an error generating the vulnerable password example."
      )
    }
  }
})
