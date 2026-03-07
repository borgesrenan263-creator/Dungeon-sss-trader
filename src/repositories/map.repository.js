const { initDB } = require("../config/database");

async function getWorldMap(){

  const db = await initDB();

  const result = db.exec(`
  SELECT
    id,
    sector_name,
    min_level,
    max_level,
    recommended_power,
    gold_bonus_percent,
    drop_bonus_percent
  FROM world_sectors
  ORDER BY id ASC
  `);

  if(!result.length){
    return [];
  }

  return result[0].values.map(row => ({
    sector_id:row[0],
    sector_name:row[1],
    min_level:row[2],
    max_level:row[3],
    recommended_power:row[4],
    gold_bonus_percent:row[5],
    drop_bonus_percent:row[6]
  }));

}

async function getSectorDetails(sectorId){

  const db = await initDB();

  const result = db.exec(`
  SELECT
    id,
    sector_name,
    min_level,
    max_level,
    recommended_power,
    description
  FROM world_sectors
  WHERE id = ?
  `,[Number(sectorId)]);

  if(!result.length || !result[0].values.length){
    throw new Error("sector not found");
  }

  const row = result[0].values[0];

  return {
    sector_id:row[0],
    sector_name:row[1],
    min_level:row[2],
    max_level:row[3],
    recommended_power:row[4],
    description:row[5]
  }

}

module.exports = {
  getWorldMap,
  getSectorDetails
};
