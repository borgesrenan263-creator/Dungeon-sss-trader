const express = require("express");
const router = express.Router();

const { getAllPlayers } = require("../state/game.state");

router.get("/leaderboard",(req,res)=>{

 const players = getAllPlayers();

 const gold = players
   .map(p=>({ name:p.name, gold:p.gold || 0 }))
   .sort((a,b)=>b.gold-a.gold);

 const pvp = players
   .map(p=>({ name:p.name, wins:p.pvp?.wins || 0 }))
   .sort((a,b)=>b.wins-a.wins);

 return res.status(200).json({
  ok:true,
  leaderboard:{
   gold,
   pvp
  }
 });

});


router.get("/analytics/world",(req,res)=>{

 const players = getAllPlayers();

 return res.status(200).json({
  ok:true,
  analytics:{
   ticks:1,
   spawnRate:1,
   totalPlayers:players.length,
   onlinePlayers:players.filter(p=>p.isOnline).length
  }
 });

});


router.get("/telemetry",(req,res)=>{

 return res.status(200).json({
  ok:true,
  telemetry:{
   cpu:0,
   memory:0,
   tickRate:1
  }
 });

});

module.exports = router;
