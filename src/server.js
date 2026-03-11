const express = require("express");
const routes = require("./api/routes");
const { startEngine } = require("./engine/start_engine");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use("/", routes);

app.listen(PORT, () => {
  console.log("🌐 Server rodando na porta", PORT);
  startEngine();
});
