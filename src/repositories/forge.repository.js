const { initDB, saveDB } = require("../config/database");

const UPGRADE_TABLE = {
  0: { success: 100 },
  1: { success: 85 },
  2: { success: 60 },
  3: { success: 35 },
  4: { success: 15 }
};

async function upgradeItem(inventoryId) {

  const db = await initDB();

  const result = db.exec(`
    SELECT id, player_id, item_id, upgrade_level
    FROM inventory
    WHERE id = ?
  `,[Number(inventoryId)]);

  if(!result.length || !result[0].values.length){
    throw new Error("item not found in inventory");
  }

  const item = result[0].values[0];

  const level = item[3];

  if(level >= 5){
    throw new Error("max upgrade reached");
  }

  const rule = UPGRADE_TABLE[level];

  const roll = Math.random()*100;

  let newLevel = level;
  let outcome = "fail";

  if(roll <= rule.success){

    outcome = "success";
    newLevel = level + 1;

  }else{

    if(level >= 3){

      const breakRoll = Math.random();

      if(breakRoll < 0.25){

        db.run(`
          DELETE FROM inventory
          WHERE id = ?
        `,[Number(inventoryId)]);

        saveDB();

        return {
          result:"item_destroyed"
        }

      }

      if(breakRoll < 0.50){

        outcome = "downgrade";
        newLevel = level - 1;

      }

    }

  }

  db.run(`
    UPDATE inventory
    SET upgrade_level = ?
    WHERE id = ?
  `,[newLevel,Number(inventoryId)]);

  saveDB();

  return {
    inventory_id:item[0],
    player_id:item[1],
    item_id:item[2],
    old_level:level,
    new_level:newLevel,
    result:outcome
  }

}

module.exports = {
  upgradeItem
};
