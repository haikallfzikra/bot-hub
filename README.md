# AbyssIntern Discord Bot

A Discord bot built with Bun, discord.js v14, and Express — designed for small servers.

Bot Discord yang dibangun dengan Bun, discord.js v14, dan Express — dirancang untuk server kecil.

---

## Tech Stack

| | |
|---|---|
| Runtime | Bun v1.3 |
| Library | discord.js v14 |
| API Server | Express v5 |
| Module System | ESM (`"type": "module"`) |
| Football Data | football-data.org |

---

## Project Structure / Struktur Project

```
src/
├── index.js              # Entry point — bot + API
├── api/
│   ├── server.js
│   └── routes/
│       └── health.js     # GET /health
└── bot/
    ├── client.js         # Discord client + command/event loader
    ├── events/
    │   └── interactionCreate.js
    └── commands/
        ├── ping.js
        ├── poll.js
        └── match.js
```

---

## Setup

### 1. Install dependencies / Install dependensi

```bash
bun install
```

### 2. Environment variables

Create a `.env` file in the root directory.
Buat file `.env` di root directory.

```env
DISCORD_TOKEN=your_discord_bot_token
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_GUILD_ID=your_discord_guild_id
FOOTBALL_DATA_KEY=your_football_data_api_key
```

Get your football API key at [football-data.org](https://www.football-data.org).
Dapatkan API key di [football-data.org](https://www.football-data.org).

### 3. Register slash commands / Daftarkan slash commands

```bash
bun run deploy
```

### 4. Run the bot / Jalankan bot

```bash
# Development (auto-reload)
bun run dev

# Production
bun run start
```

---

## Commands

### `/ping`

Displays bot status information.
Menampilkan informasi status bot.

| Field | Description |
|---|---|
| Gateway Latency | WebSocket ping to Discord |
| Message Latency | Round-trip message time |
| Uptime | How long the bot has been running |
| Memory Usage | Current memory consumption |

---

### `/poll`

Creates an interactive poll with buttons.
Membuat polling interaktif dengan tombol.

```
/poll question: <question> options: <opt1, opt2, opt3>
```

**Example / Contoh:**
```
/poll question: Where to eat? options: McDonald's, KFC, Sushi
```

**Features / Fitur:**
- 2–20 options per poll / 2–20 opsi per poll
- One vote per user / Satu vote per user
- Click the same option to remove vote / Klik opsi yang sama untuk batalkan vote
- Live vote count and percentage / Jumlah vote dan persentase real-time
- Progress bar per option / Progress bar per opsi

---

### `/match`

EPL match information powered by football-data.org.
Informasi pertandingan EPL dari football-data.org.

#### Subcommands / Subcommand

| Subcommand | Description | Options |
|---|---|---|
| `today` | Matches today / Match hari ini | `team` (optional) |
| `yesterday` | Matches yesterday / Match kemarin | `team` (optional) |
| `live` | Currently live matches / Match yang sedang berlangsung | `team` (optional) |
| `date` | Matches on a specific date / Match di tanggal tertentu | `date` (required), `team` (optional) |
| `detail` | Full match detail, goals, and lineup | `id` (required) |
| `standings` | Current EPL standings / Klasemen EPL saat ini | — |

**Examples / Contoh:**

```
/match today
/match today team: Liverpool
/match yesterday team: Arsenal
/match live
/match date date: 2025-03-15
/match date date: 2025-03-15 team: Chelsea
/match detail id: 123456
/match standings
```

> Match IDs are shown in the output of `today`, `yesterday`, `date`, and `live`.
> ID match ditampilkan di hasil `today`, `yesterday`, `date`, dan `live`.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Check if the API is running |

---

## Notes / Catatan

- All data is stored **in memory** — restarting the bot will clear all active polls.
- Semua data disimpan **di memory** — restart bot akan menghapus semua poll yang aktif.
- The bot is designed for **1–2 small servers**, not large-scale deployments.
- Bot ini dirancang untuk **1–2 server kecil**, bukan deployment skala besar.
- football-data.org free tier supports EPL current season with a rate limit of 10 requests/minute.
- Free tier football-data.org mendukung EPL musim berjalan dengan rate limit 10 request/menit.