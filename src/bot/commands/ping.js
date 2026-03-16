import { SlashCommandBuilder, EmbedBuilder } from "discord.js"

export const command = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Check bot status and latency"),

  async execute(interaction) {

    const sent = await interaction.reply({
      content: "Checking connection...",
      fetchReply: true
    })

    const messageLatency = sent.createdTimestamp - interaction.createdTimestamp
    const gatewayLatency = Math.round(interaction.client.ws.ping)

    const uptime = process.uptime()
    const uptimeSeconds = Math.floor(uptime % 60)
    const uptimeMinutes = Math.floor((uptime / 60) % 60)
    const uptimeHours = Math.floor(uptime / 3600)

    const memory = process.memoryUsage().rss / 1024 / 1024

    const embed = new EmbedBuilder()
      .setTitle("Bot Status")
      .setColor(0x57F287)
      .setDescription(
`Gateway Latency
\`\`\`ansi
\u001b[32m${gatewayLatency} ms\u001b[0m
\`\`\`

Message Latency
\`\`\`ansi
\u001b[32m${messageLatency} ms\u001b[0m
\`\`\`

Uptime
\`\`\`ansi
\u001b[32m${uptimeHours}h ${uptimeMinutes}m ${uptimeSeconds}s\u001b[0m
\`\`\`

Memory Usage
\`\`\`ansi
\u001b[32m${memory.toFixed(2)} MB\u001b[0m
\`\`\`
`)
      .setTimestamp()

    await interaction.editReply({
      content: null,
      embeds: [embed]
    })
  }
}