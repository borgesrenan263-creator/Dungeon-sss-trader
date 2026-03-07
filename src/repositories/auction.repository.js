const { initDB, saveDB } = require("../config/database");

async function ensureAuctionTables(){

const db = await initDB();

db.run(`
CREATE TABLE IF NOT EXISTS auctions (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 seller_player_id INTEGER,
 inventory_id INTEGER,
 item_id INTEGER,
 start_price INTEGER,
 current_bid INTEGER,
 highest_bidder INTEGER,
 status TEXT DEFAULT 'active',
 created_at TEXT
)
`);

saveDB();

}

async function createAuction(playerId,inventoryId,startPrice){

const db = await initDB();

const item = db.exec(`
SELECT player_id,item_id
FROM inventory
WHERE id = ?
`,[inventoryId]);

if(!item.length || !item[0].values.length){
 throw new Error("inventory item not found");
}

const row = item[0].values[0];

if(row[0] != playerId){
 throw new Error("item not owned");
}

db.run(`
INSERT INTO auctions
(seller_player_id,inventory_id,item_id,start_price,current_bid,created_at)
VALUES (?,?,?,?,?,datetime('now'))
`,[
playerId,
inventoryId,
row[1],
startPrice,
startPrice
]);

saveDB();

return {
 seller_player_id:playerId,
 inventory_id:inventoryId,
 start_price:startPrice
};

}

async function placeBid(playerId,auctionId,bid){

const db = await initDB();

const auction = db.exec(`
SELECT current_bid,status
FROM auctions
WHERE id = ?
`,[auctionId]);

if(!auction.length || !auction[0].values.length){
 throw new Error("auction not found");
}

const row = auction[0].values[0];

if(row[1] !== "active"){
 throw new Error("auction closed");
}

if(bid <= row[0]){
 throw new Error("bid too low");
}

db.run(`
UPDATE auctions
SET current_bid = ?, highest_bidder = ?
WHERE id = ?
`,[bid,playerId,auctionId]);

saveDB();

return {
 auction_id:auctionId,
 bid:bid
};

}

async function closeAuction(auctionId){

const db = await initDB();

const auction = db.exec(`
SELECT seller_player_id,inventory_id,highest_bidder,current_bid
FROM auctions
WHERE id = ?
`,[auctionId]);

if(!auction.length || !auction[0].values.length){
 throw new Error("auction not found");
}

const row = auction[0].values[0];

db.run(`
UPDATE auctions
SET status = 'closed'
WHERE id = ?
`,[auctionId]);

if(row[2]){
 db.run(`
 UPDATE inventory
 SET player_id = ?
 WHERE id = ?
 `,[row[2],row[1]]);
}

saveDB();

return {
 auction_id:auctionId,
 winner:row[2],
 price:row[3]
};

}

async function listAuctions(){

const db = await initDB();

const result = db.exec(`
SELECT id,item_id,current_bid,status
FROM auctions
WHERE status = 'active'
`);

if(!result.length) return [];

return result[0].values.map(r=>({
 auction_id:r[0],
 item_id:r[1],
 current_bid:r[2],
 status:r[3]
}));

}

module.exports = {
 ensureAuctionTables,
 createAuction,
 placeBid,
 closeAuction,
 listAuctions
};
