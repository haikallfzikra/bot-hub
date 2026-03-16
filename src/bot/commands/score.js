import { SlashCommandBuilder, EmbedBuilder } from "discord.js"

const API_BASE = "https://v3.football.api-sports.io"
const API_KEY = Bun.env.FOOTBALL_API_KEY

async function fetchFixtures(params) {
  const url = new URL(`${API_BASE}/fixtures`)
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }

  const res = await fetch(url.toString(), {
    headers: {
      "x-apisports-key": API_KEY
    }
  })

  const data = await res.json()
  return data.response ?? []
}

async function fetchTeamId(teamName) {
  const res = await fetch(`${API_BASE}/teams?search=${encodeURIComponent(teamName)}`, {
    headers: {
      "x-apisports-key": API_KEY
    }
  })

  const data = await res.json()
  return data.response?.[0]?.team?.id ?? null
}

function formatStatus(fixture) {
  const short = fixture.fixture.status.short
  const elapsed = fixture.fixture.status.elapsed

  if (short === "NS") return "Not started"
  if (short === "FT") return "Full time"
  if (short === "HT") return "Half time"
  if (short === "1H" || short === "2H") return `${elapsed}'`
  if (short === "ET") return `${elapsed}' (ET)`
  if (short === "PEN") return "Penalties"
  if (short === "PST") return "Postponed"
  if (short === "CANC") return "Cancelled"
  return short
}

function formatScore(fixture) {
  const home = fixture.goals.home ?? "-"
  const away = fixture.goals.away ?? "-"
  return `${home} - ${away}`
}

function buildFixtureLines(fixtures) {
  if (fixtures.length === 0) return "No matches found."

  return fixtures
    .map(f => {
      const home = f.teams.home.name
      const away = f.teams.away.name
      const score = formatScore(f)
      const status = formatStatus(f)
      const league = f.league.name

      return `**${home}** vs **${away}**\n${score} · ${status} · ${league}`
    })
    .join("\n\n")
}

function getTodayDate() {
  return new Date().toISOString().split("T")[0]
}

export const command = {
  data: new SlashCommandBuilder()
    .setName("score")
    .setDescription("Get football match scores")
    .addStringOption(o =>
      o.setName("team")
        .setDescription("Filter by team name (optional)")
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply()

    const teamName = interaction.options.getString("team")
    const today = getTodayDate()

    try {
      let fixtures = []

      if (teamName) {
        const teamId = await fetchTeamId(teamName)

        if (!teamId) {
          return interaction.editReply({
            content: `No team found for **${teamName}**.`
          })
        }

        fixtures = await fetchFixtures({ date: today, team: teamId })
      } else {
        fixtures = await fetchFixtures({ date: today })
      }

      if (fixtures.length === 0) {
        return interaction.editReply({
          content: teamName
            ? `No matches today for **${teamName}**.`
            : "No matches today."
        })
      }

      const chunks = []
      for (let i = 0; i < fixtures.length; i += 10) {
        chunks.push(fixtures.slice(i, i + 10))
      }

      const embeds = chunks.map((chunk, index) => {
        const description = buildFixtureLines(chunk)
        const embed = new EmbedBuilder()
          .setColor(0x1a73e8)
          .setDescription(description)
          .setFooter({ text: `Today · ${today}` })

        if (index === 0) {
          embed.setTitle(
            teamName
              ? `Matches today — ${teamName}`
              : `Matches today`
          )
        }

        return embed
      })

      await interaction.editReply({ embeds: embeds.slice(0, 10) })
    } catch (err) {
      console.error("[Score] Error:", err)
      await interaction.editReply({
        content: "Failed to fetch scores. Please try again later."
      })
    }
  }
}