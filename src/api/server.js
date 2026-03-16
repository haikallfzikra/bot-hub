import express from "express"

const app = express()

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime()
  })
})

app.listen(Bun.env.PORT || 3000, () => {
  console.log("API running on port", Bun.env.PORT || 3000)
})