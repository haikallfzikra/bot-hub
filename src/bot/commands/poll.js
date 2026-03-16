import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from "discord.js"

// State 
const polls = new Map()

// Helpers

function createPollId() {
  return Date.now().toString()
}

function getTotalVotes(votes) {
  return Object.values(votes).reduce((sum, arr) => sum + arr.length, 0)
}

function findUserVote(votes, userId) {
  for (const [option, voters] of Object.entries(votes)) {
    if (voters.includes(userId)) return option
  }
  return null
}

function buildProgressBar(count, total, length = 10) {
  if (total === 0) return "▱".repeat(length)
  const filled = Math.round((count / total) * length)
  return "▰".repeat(filled) + "▱".repeat(length - filled)
}

function buildEmbed(poll) {
  const total = getTotalVotes(poll.votes)
  const isClosed = poll.closed

  const description = poll.options
    .map(opt => {
      const count = poll.votes[opt].length
      const pct = total > 0 ? ((count / total) * 100).toFixed(1) : "0.0"
      const bar = buildProgressBar(count, total)
      return `**${opt}**\n${bar} ${count} vote (${pct}%)`
    })
    .join("\n\n")

  return new EmbedBuilder()
    .setTitle(poll.question)
    .setDescription(description || "No options available.")
    .setColor(isClosed ? 0x95a5a6 : 0x5865f2)
    .setFooter({
      text: isClosed
        ? `Poll closed · Total: ${total} vote(s)`
        : `Total: ${total} vote(s) · Click to vote`
    })
}

function buildComponents(poll) {
  if (poll.closed) return []

  const buttons = poll.options.map(opt =>
    new ButtonBuilder()
      .setCustomId(`poll:${poll.id}:${opt}`)
      .setLabel(opt)
      .setStyle(ButtonStyle.Primary)
  )

  const rows = []
  for (let i = 0; i < buttons.length; i += 5) {
    rows.push(new ActionRowBuilder().addComponents(buttons.slice(i, i + 5)))
  }

  return rows
}

// Command

export const command = {
  data: new SlashCommandBuilder()
    .setName("poll")
    .setDescription("Create a poll with buttons")
    .addStringOption(o =>
      o.setName("question")
        .setDescription("Poll question")
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName("options")
        .setDescription("Options separated by comma, e.g. A, B, C (max 20)")
        .setRequired(true)
    ),

  async execute(interaction) {
    const question = interaction.options.getString("question")
    const rawOptions = interaction.options.getString("options")

    if (!rawOptions) {
      return interaction.reply({
        content: "Missing options. Please try again.",
        flags: ["Ephemeral"]
      })
    }

    const options = rawOptions
      .split(",")
      .map(o => o.trim())
      .filter(Boolean)

    if (options.length < 2) {
      return interaction.reply({
        content: "A poll must have at least **2 options**.",
        flags: ["Ephemeral"]
      })
    }

    if (options.length > 20) {
      return interaction.reply({
        content: "A poll can have at most **20 options**.",
        flags: ["Ephemeral"]
      })
    }

    const pollId = createPollId()
    const votes = {}
    options.forEach(opt => { votes[opt] = [] })

    const poll = {
      id: pollId,
      question,
      options,
      votes,
      closed: false,
      creatorId: interaction.user.id
    }

    polls.set(pollId, poll)

    await interaction.reply({
      embeds: [buildEmbed(poll)],
      components: buildComponents(poll)
    })
  }
}

// Button Handler

export async function handlePollVote(interaction) {
  if (!interaction.isButton()) return
  if (!interaction.customId.startsWith("poll:")) return

  const [, pollId, option] = interaction.customId.split(":")
  const poll = polls.get(pollId)

  if (!poll) {
    return interaction.reply({
      content: "Poll not found or has expired.",
      flags: ["Ephemeral"]
    })
  }

  if (poll.closed) {
    return interaction.reply({
      content: "This poll is already closed.",
      flags: ["Ephemeral"]
    })
  }

  if (!poll.votes[option]) {
    return interaction.reply({
      content: "Invalid option.",
      flags: ["Ephemeral"]
    })
  }

  const userId = interaction.user.id
  const previousVote = findUserVote(poll.votes, userId)

  if (previousVote === option) {
    poll.votes[option] = poll.votes[option].filter(id => id !== userId)

    await interaction.update({
      embeds: [buildEmbed(poll)],
      components: buildComponents(poll)
    })

    return interaction.followUp({
      content: `Your vote for **${option}** has been removed.`,
      flags: ["Ephemeral"]
    })
  }

  if (previousVote) {
    poll.votes[previousVote] = poll.votes[previousVote].filter(id => id !== userId)
  }

  poll.votes[option].push(userId)

  await interaction.update({
    embeds: [buildEmbed(poll)],
    components: buildComponents(poll)
  })

  const msg = previousVote
    ? `Your vote has been moved from **${previousVote}** to **${option}**.`
    : `You voted for **${option}**.`

  return interaction.followUp({
    content: msg,
    flags: ["Ephemeral"]
  })
}