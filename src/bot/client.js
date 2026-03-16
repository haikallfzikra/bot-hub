import { Client, GatewayIntentBits, Collection } from "discord.js"
import fs from "fs"
import path from "path"

export const client = new Client({
  intents: [GatewayIntentBits.Guilds]
})

client.commands = new Collection()

const commandsPath = "./src/bot/commands"
const commandFiles = fs.readdirSync(commandsPath)

for (const file of commandFiles) {
  console.log("Loading command:", file)
  const module = await import(`../bot/commands/${file}`)
  const command = module.command || module.default
  if (!command) {
    console.log(`Invalid command file: ${file}`)
    continue
  }
  client.commands.set(command.data.name, command)
}

const eventsPath = "./src/bot/events"
const eventFiles = fs.readdirSync(eventsPath)

for (const file of eventFiles) {
  const module = await import(`../bot/events/${file}`)
  const event = module.event || module.default
  if (!event) {
    console.log(`Invalid event file: ${file}`)
    continue
  }
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client))
  } else {
    client.on(event.name, (...args) => event.execute(...args, client))
  }
}

client.login(Bun.env.DISCORD_TOKEN)