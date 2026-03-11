const express = require("express")
const http = require("http")

const app = express()

app.use(express.json())

/*
---------------------------------
BASIC HEALTH ROUTE (Render check)
---------------------------------
*/
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "Dungeon SSS Trader",
    uptime: process.uptime()
  })
})

/*
---------------------------------
DASHBOARD ROUTE
---------------------------------
*/
app.get("/dashboard", (req, res) => {
  res.send("Dungeon SSS Trader Dashboard Online")
})

/*
---------------------------------
ROOT ROUTE
---------------------------------
*/
app.get("/", (req, res) => {
  res.json({
    service: "Dungeon SSS Trader API",
    status: "running"
  })
})

/*
---------------------------------
SERVER START
---------------------------------
*/

const PORT = process.env.PORT || 3000

const server = http.createServer(app)

server.listen(PORT, "0.0.0.0", () => {
  console.log("Dungeon SSS Trader running on port:", PORT)
})
