const { initDB, saveDB } = require("../config/database");
const { createEvent } = require("./events.repository");

const BUY_RATE = 10000;
const SELL_RATE = 9000;

async function buyObsidianWithGold(playerId, amount){

const db = await initDB();

const cost = amount * BUY_RATE;

const wallet = db.exec(`
SELECT gold
FROM currencies
WHERE player_id = ?
`,[Number(playerId)]);

const gold = wallet[0].values[0][0];

if(gold < cost){
 throw new Error("insufficient gold");
}

db.run(`
UPDATE currencies
SET gold = gold - ?
WHERE player_id = ?
`,[cost,Number(playerId)]);

db.run(`
UPDATE currencies
SET obsidian = obsidian + ?
WHERE player_id = ?
`,[Number(amount),Number(playerId)]);

saveDB();

await createEvent({
 eventType:"exchange_buy_obsidian",
 title:"Obsidian Purchased",
 message:`💎 Player ${playerId} bought ${amount} obsidian for ${cost} gold`
});

return {
 player_id:playerId,
 obsidian_bought:amount,
 gold_spent:cost
};

}

async function sellObsidianForGold(playerId, amount){

const db = await initDB();

const wallet = db.exec(`
SELECT obsidian
FROM currencies
WHERE player_id = ?
`,[Number(playerId)]);

const obsidian = wallet[0].values[0][0];

if(obsidian < amount){
 throw new Error("insufficient obsidian");
}

const goldGain = amount * SELL_RATE;

db.run(`
UPDATE currencies
SET obsidian = obsidian - ?
WHERE player_id = ?
`,[amount,Number(playerId)]);

db.run(`
UPDATE currencies
SET gold = gold + ?
WHERE player_id = ?
`,[goldGain,Number(playerId)]);

saveDB();

await createEvent({
 eventType:"exchange_sell_obsidian",
 title:"Obsidian Sold",
 message:`💰 Player ${playerId} sold ${amount} obsidian for ${goldGain} gold`
});

return {
 player_id:playerId,
 obsidian_sold:amount,
 gold_received:goldGain
};

}

module.exports = {
 buyObsidianWithGold,
 sellObsidianForGold
};
