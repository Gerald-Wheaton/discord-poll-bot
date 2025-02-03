import { REST, Routes } from "discord.js"
import { sneakinOrTweakin } from "./sneakinOrTweakin"
import { susOrTrustCommand } from "./susOrTrust"
import { quizBuilderCommand } from "./quizMe"
import dotenv from "dotenv"

dotenv.config()

const commands = [
  sneakinOrTweakin.toJSON(),
  susOrTrustCommand.toJSON(),
  quizBuilderCommand.toJSON(),
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
