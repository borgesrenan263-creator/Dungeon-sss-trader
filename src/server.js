const app = require("./app")

const PORT = process.env.PORT || 8787

app.listen(PORT, () => {
  console.log("")
  console.log("🚀 Dungeon SSS Trader Server")
  console.log("🌍 running on port:", PORT)
  console.log("📡 http://127.0.0.1:" + PORT)
  console.log("")
})
