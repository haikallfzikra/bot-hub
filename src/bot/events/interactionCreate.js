import { handlePollVote } from "../commands/poll.js"

export default {
  name: "interactionCreate",
  async execute(interaction, client) {
    if (interaction.isChatInputCommand()) {
      const command = (client ?? interaction.client).commands.get(interaction.commandName)
      if (!command) return
      try {
        await command.execute(interaction)
      } catch (err) {
        console.error(err)
        const reply = { content: "An error occurred.", flags: ["Ephemeral"] }
        interaction.replied ? interaction.followUp(reply) : interaction.reply(reply)
      }
    }

    if (interaction.isButton() && interaction.customId.startsWith("poll:")) {
      try {
        await handlePollVote(interaction)
      } catch (err) {
        console.error("[Poll] Button handler error:", err)
      }
    }
  }
}