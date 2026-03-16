import { REST, Routes } from "discord.js"
import fs from "fs"

const commands = []
const files = fs.readdirSync("./src/bot/commands")

for (const file of files) {
  const { command } = await import(`../bot/commands/${file}`)
  commands.push(command.data.toJSON())
}

const rest = new REST({ version: "10" }).setToken(Bun.env.DISCORD_TOKEN)

await rest.put(
  Routes.applicationGuildCommands(
    Bun.env.DISCORD_CLIENT_ID,
    Bun.env.DISCORD_GUILD_ID
  ),
  { body: commands }
)

console.log("Slash commands registered")