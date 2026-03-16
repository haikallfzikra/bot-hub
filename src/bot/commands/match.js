import { SlashCommandBuilder, EmbedBuilder } from "discord.js"

const API_BASE = "https://api.football-data.org/v4"
const API_KEY = Bun.env.FOOTBALL_DATA_KEY
const EPL_ID = 2021

const MAX_CHARS = 4000

// API

async function apiFetch(endpoint, params = {}) {
  const url = new URL(`${API_BASE}/${endpoint}`)
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }

  const res = await fetch(url.toString(), {
    headers: { "X-Auth-Token": API_KEY }
  })

  const data = await res.json()
  return data
}

async function fetchMatchesByDate(date, teamId = null) {
  if (teamId) {
    const data = await apiFetch(`teams/${teamId}/matches`, {
      dateFrom: date,
      dateTo: date,
      competitions: EPL_ID
    })
    return data.matches ?? []
  }

  const data = await apiFetch(`competitions/${EPL_ID}/matches`, {
    dateFrom: date,
    dateTo: date
  })
  return data.matches ?? []
}

async function fetchMatchById(matchId) {
  const data = await apiFetch(`matches/${matchId}`)
  return data ?? null
}

async function fetchLiveMatches(teamId = null) {
  if (teamId) {
    const data = await apiFetch(`teams/${teamId}/matches`, {
      competitions: EPL_ID,
      status: "IN_PLAY,PAUSED,HALFTIME"
    })
    return data.matches ?? []
  }

  const data = await apiFetch(`competitions/${EPL_ID}/matches`, {
    status: "IN_PLAY,PAUSED,HALFTIME"
  })
  return data.matches ?? []
}

async function fetchTeamId(teamName) {
  const data = await apiFetch(`competitions/${EPL_ID}/teams`)
  const teams = data.teams ?? []
  const found = teams.find(t =>
    t.name.toLowerCase().includes(teamName.toLowerCase()) ||
    t.shortName?.toLowerCase().includes(teamName.toLowerCase()) ||
    t.tla?.toLowerCase().includes(teamName.toLowerCase())
  )
  return found?.id ?? null
}

async function fetchStandings() {
  const data = await apiFetch(`competitions/${EPL_ID}/standings`)
  return data.standings?.[0]?.table ?? []
}

// Helpers

function getYesterdayDate() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().split("T")[0]
}

function getTodayDate() {
  return new Date().toISOString().split("T")[0]
}

function formatStatus(match) {
  const status = match.status

  if (status === "SCHEDULED") return "Scheduled"
  if (status === "TIMED") return "Scheduled"
  if (status === "IN_PLAY") return `${match.minute ?? "?"}'`
  if (status === "PAUSED") return "Half time"
  if (status === "HALFTIME") return "Half time"
  if (status === "FINISHED") return "Full time"
  if (status === "POSTPONED") return "Postponed"
  if (status === "CANCELLED") return "Cancelled"
  if (status === "SUSPENDED") return "Suspended"
  return status
}

function formatScore(match) {
  const home = match.score?.fullTime?.home ?? match.score?.halfTime?.home ?? "-"
  const away = match.score?.fullTime?.away ?? match.score?.halfTime?.away ?? "-"
  return `${home} - ${away}`
}

function formatMatchDate(match) {
  if (!match.utcDate) return "Unknown date"
  return new Date(match.utcDate).toUTCString()
}

function truncateLines(lines) {
  let description = ""
  for (const line of lines) {
    const next = (description ? "\n\n" : "") + line
    if ((description + next).length > MAX_CHARS) break
    description += next
  }
  return description
}

// Embed Builders

function buildMatchListEmbed(matches, date, teamName = null) {
  const lines = matches.map(m => {
    const home = m.homeTeam.name
    const away = m.awayTeam.name
    const score = formatScore(m)
    const status = formatStatus(m)
    const id = m.id

    return `**${home}** vs **${away}**\n${score} · ${status}\nID: \`${id}\``
  })

  return new EmbedBuilder()
    .setTitle(teamName ? `EPL Matches — ${teamName} · ${date}` : `EPL Matches · ${date}`)
    .setDescription(truncateLines(lines) || "No matches found.")
    .setColor(0x3d195b)
    .setFooter({ text: "Premier League · football-data.org" })
}

function buildLiveEmbed(matches, teamName = null) {
  const lines = matches.map(m => {
    const home = m.homeTeam.name
    const away = m.awayTeam.name
    const score = formatScore(m)
    const status = formatStatus(m)
    const id = m.id

    return `**${home}** vs **${away}**\n${score} · ${status}\nID: \`${id}\``
  })

  return new EmbedBuilder()
    .setTitle(teamName ? `EPL Live — ${teamName}` : "EPL Live Now")
    .setDescription(truncateLines(lines) || "No live matches.")
    .setColor(0xe74c3c)
    .setFooter({ text: "Premier League · football-data.org" })
}

function buildDetailEmbed(match) {
  const home = match.homeTeam.name
  const away = match.awayTeam.name
  const score = formatScore(match)
  const status = formatStatus(match)
  const date = formatMatchDate(match)
  const venue = match.venue ?? "Unknown venue"
  const matchday = match.matchday ? `Matchday ${match.matchday}` : ""
  const stage = match.stage ?? ""

  return new EmbedBuilder()
    .setTitle(`${home} vs ${away}`)
    .setDescription(`**${score}** · ${status}`)
    .setColor(0x3d195b)
    .addFields(
      { name: "Competition", value: `Premier League${matchday ? ` · ${matchday}` : ""}`, inline: true },
      { name: "Venue", value: venue, inline: true },
      { name: "Date", value: date, inline: false }
    )
}

function buildLineupEmbed(match) {
  const lineups = match.lineups

  if (!lineups || lineups.length === 0) {
    return new EmbedBuilder()
      .setTitle("Lineups")
      .setDescription("Lineup not available.")
      .setColor(0x3d195b)
  }

  const fields = lineups.map(team => {
    const starters = team.startXI
      ?.map((p, i) => `${i + 1}. ${p.player.name} (#${p.player.shirtNumber ?? "?"})`)
      .join("\n") ?? "-"

    const subs = team.substitutes
      ?.map(p => `${p.player.name} (#${p.player.shirtNumber ?? "?"})`)
      .join("\n") ?? "-"

    return {
      name: `${team.team.name} · ${team.formation ?? "?"}`,
      value: `**Starters**\n${starters}\n\n**Substitutes**\n${subs}`,
      inline: true
    }
  })

  return new EmbedBuilder()
    .setTitle("Starting Lineup")
    .setColor(0x3d195b)
    .addFields(fields)
}

function buildGoalsEmbed(match) {
  const goals = match.goals

  if (!goals || goals.length === 0) {
    return new EmbedBuilder()
      .setTitle("Match Events")
      .setDescription("No goals recorded.")
      .setColor(0x3d195b)
  }

  const home = match.homeTeam.name
  const away = match.awayTeam.name

  const lines = goals.map(g => {
    const minute = g.minute ? `${g.minute}'` : "?"
    const scorer = g.scorer?.name ?? "Unknown"
    const team = g.team?.name ?? "Unknown"
    const type = g.type === "OWN" ? " [OG]" : g.type === "PENALTY" ? " [P]" : ""

    return `${minute} [G]${type} **${team}** — ${scorer}`
  })

  return new EmbedBuilder()
    .setTitle(`Goals — ${home} vs ${away}`)
    .setDescription(lines.join("\n") || "No goals.")
    .setColor(0x3d195b)
}

function buildStandingsEmbed(table) {
  const lines = table.map(row => {
    const pos = String(row.position).padStart(2, " ")
    const team = row.team.shortName ?? row.team.name
    const pts = String(row.points).padStart(3, " ")
    const played = row.playedGames
    const gd = row.goalDifference >= 0 ? `+${row.goalDifference}` : `${row.goalDifference}`

    return `\`${pos}.\` **${team}** — ${pts} pts · ${played} played · GD ${gd}`
  })

  return new EmbedBuilder()
    .setTitle("EPL Standings")
    .setDescription(lines.join("\n") || "No standings available.")
    .setColor(0x3d195b)
    .setFooter({ text: "Premier League · football-data.org" })
}

// Subcommand Handlers

async function handleToday(interaction) {
  const teamName = interaction.options.getString("team")
  const today = getTodayDate()

  let teamId = null
  if (teamName) {
    teamId = await fetchTeamId(teamName)
    if (!teamId) {
      return interaction.editReply({ content: `No EPL team found for **${teamName}**.` })
    }
  }

  const matches = await fetchMatchesByDate(today, teamId)

  if (matches.length === 0) {
    return interaction.editReply({
      content: teamName ? `No EPL matches today for **${teamName}**.` : "No EPL matches today."
    })
  }

  await interaction.editReply({
    embeds: [buildMatchListEmbed(matches, today, teamName)]
  })
}

async function handleYesterday(interaction) {
  const teamName = interaction.options.getString("team")
  const yesterday = getYesterdayDate()

  let teamId = null
  if (teamName) {
    teamId = await fetchTeamId(teamName)
    if (!teamId) {
      return interaction.editReply({ content: `No EPL team found for **${teamName}**.` })
    }
  }

  const matches = await fetchMatchesByDate(yesterday, teamId)

  if (matches.length === 0) {
    return interaction.editReply({
      content: teamName
        ? `No EPL matches yesterday for **${teamName}**.`
        : "No EPL matches yesterday."
    })
  }

  await interaction.editReply({
    embeds: [buildMatchListEmbed(matches, yesterday, teamName)]
  })
}

async function handleLive(interaction) {
  const teamName = interaction.options.getString("team")

  let teamId = null
  if (teamName) {
    teamId = await fetchTeamId(teamName)
    if (!teamId) {
      return interaction.editReply({ content: `No EPL team found for **${teamName}**.` })
    }
  }

  const matches = await fetchLiveMatches(teamId)

  if (matches.length === 0) {
    return interaction.editReply({
      content: teamName
        ? `No live EPL matches for **${teamName}** right now.`
        : "No live EPL matches right now."
    })
  }

  await interaction.editReply({
    embeds: [buildLiveEmbed(matches, teamName)]
  })
}

async function handleDetail(interaction) {
  const matchId = interaction.options.getInteger("id")
  const match = await fetchMatchById(matchId)

  if (!match || match.id === undefined) {
    return interaction.editReply({ content: `No match found for ID \`${matchId}\`.` })
  }

  await interaction.editReply({
    embeds: [
      buildDetailEmbed(match),
      buildGoalsEmbed(match),
      buildLineupEmbed(match)
    ]
  })
}

async function handleStandings(interaction) {
  const table = await fetchStandings()

  if (table.length === 0) {
    return interaction.editReply({ content: "Standings not available." })
  }

  await interaction.editReply({
    embeds: [buildStandingsEmbed(table)]
  })
}

// Command

export const command = {
  data: new SlashCommandBuilder()
    .setName("match")
    .setDescription("EPL match info")
    .addSubcommand(sub =>
      sub
        .setName("today")
        .setDescription("EPL matches today")
        .addStringOption(o =>
          o.setName("team")
            .setDescription("Filter by team name (optional)")
            .setRequired(false)
        )
    )

    .addSubcommand(sub =>
      sub
        .setName("standings")
        .setDescription("EPL current standings")
    )
    .addSubcommand(sub =>
      sub
        .setName("yesterday")
        .setDescription("EPL matches yesterday")
        .addStringOption(o =>
          o.setName("team")
            .setDescription("Filter by team name (optional)")
            .setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName("live")
        .setDescription("EPL matches currently live")
        .addStringOption(o =>
          o.setName("team")
            .setDescription("Filter by team name (optional)")
            .setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName("detail")
        .setDescription("Full detail, goals, and lineup of a match")
        .addIntegerOption(o =>
          o.setName("id")
            .setDescription("Match ID (get from /match today, yesterday, date, or live)")
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    await interaction.deferReply()

    const sub = interaction.options.getSubcommand()

    try {
      if (sub === "today") return await handleToday(interaction)
      if (sub === "yesterday") return await handleYesterday(interaction)
      if (sub === "live") return await handleLive(interaction)
      if (sub === "date") return await handleDate(interaction)
      if (sub === "detail") return await handleDetail(interaction)
      if (sub === "standings") return await handleStandings(interaction)
    } catch (err) {
      console.error("[Match] Error:", err)
      await interaction.editReply({
        content: "Failed to fetch data. Please try again later."
      })
    }
  }
}