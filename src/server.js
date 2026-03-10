const express = require("express");

const { startEngine } = require("./engine/start_engine");

const app = express();

app.use(express.json());

app.get("/", (req,res)=>{
  res.json({
    server:"Dungeon Isekai Server",
    status:"online"
  });
});

const PORT = 3000;

app.listen(PORT, () => {

  console.log("🌐 Server rodando na porta", PORT);

  startEngine();

});
