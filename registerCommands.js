import { REST, Routes } from "discord.js"
import { passwordCommand } from "./passwordGenerator.js"
import dotenv from "dotenv"

dotenv.config()

const commands = [
  {
    name: "ask",
    description: "Ask a predefined question",
  },
  passwordCommand.toJSON(), // Convert the SlashCommandBuilder to JSON
]

const rest = new REST({ version: "10" }).setToken(process.env.BOT_TOKEN)

try {
  console.log("Started refreshing application (/) commands.")

  await rest.put(
    Routes.applicationGuildCommands(
      process.env.CLIENT_ID,
      process.env.GUILD_ID
    ),
    { body: commands }
  )

  console.log("Successfully reloaded application (/) commands.")
} catch (error) {
  console.error(error)
}
