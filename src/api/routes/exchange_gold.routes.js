const express = require("express");
const router = express.Router();

const {
 buyObsidianWithGold,
 sellObsidianForGold
} = require("../../repositories/exchange_gold.repository");

router.post("/buy-obsidian-gold", async (req,res)=>{
 try{

 const {playerId,amount} = req.body;

 const result = await buyObsidianWithGold(playerId,amount);

 res.json({ok:true,result});

 }catch(err){
 res.status(400).json({ok:false,error:err.message});
 }
});

router.post("/sell-obsidian-gold", async (req,res)=>{
 try{

 const {playerId,amount} = req.body;

 const result = await sellObsidianForGold(playerId,amount);

 res.json({ok:true,result});

 }catch(err){
 res.status(400).json({ok:false,error:err.message});
 }
});

module.exports = router;
