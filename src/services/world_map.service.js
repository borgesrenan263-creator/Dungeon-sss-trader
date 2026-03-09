const db = require("../database/db")

async function getWorldMap(){

const nodes = await db.all(`
SELECT
node_id,
node_key,
display_name,
pos_x,
pos_y,
sector_id,
is_hub,
is_dungeon,
is_boss_zone,
danger_level
FROM world_nodes
`)

return nodes

}

async function getWorldLinks(){

const links = await db.all(`
SELECT
link_id,
from_node_key,
to_node_key
FROM world_links
`)

return links

}

async function getSectorData(sectorId){

const sector = await db.get(`
SELECT
sector_id,
sector_name,
min_level,
max_level,
recommended_power,
base_gold_bonus_percent,
base_drop_bonus_percent
FROM sectors
WHERE sector_id=?
`,[sectorId])

if(!sector) return null

const node = await db.get(`
SELECT
node_id,
node_key,
display_name,
pos_x,
pos_y,
danger_level,
is_hub,
is_dungeon,
is_boss_zone
FROM world_nodes
WHERE sector_id=?
`,[sectorId])

const monsters = await db.all(`
SELECT
monster_id,
monster_name,
monster_key,
hp,
attack
FROM monsters
WHERE sector_id=?
`,[sectorId])

return {
sector,
node,
monsters
}

}

module.exports={
getWorldMap,
getWorldLinks,
getSectorData
}
