const { initDB } = require("../config/database");

async function getPlayerCombatProfile(playerId) {
  const db = await initDB();

  const playerResult = db.exec(
    `SELECT id, nickname, class, level, xp
     FROM players
     WHERE id = ?`,
    [Number(playerId)]
  );

  if (!playerResult.length || !playerResult[0].values.length) {
    throw new Error("player not found");
  }

  const player = playerResult[0].values[0];

  const charResult = db.exec(
    `SELECT strength, dexterity, intelligence, vitality, stat_points
     FROM character_progression
     WHERE player_id = ?`,
    [Number(playerId)]
  );

  if (!charResult.length || !charResult[0].values.length) {
    throw new Error("character progression not found");
  }

  const attrs = charResult[0].values[0];

  const equipResult = db.exec(
    `SELECT i.base_attack, i.base_defense, inv.upgrade_level, pe.slot_key
     FROM player_equipment pe
     INNER JOIN inventory inv ON inv.id = pe.inventory_id
     INNER JOIN items i ON i.id = inv.item_id
     WHERE pe.player_id = ?`,
    [Number(playerId)]
  );

  let bonusAttack = 0;
  let bonusDefense = 0;
  let bonusHp = 0;

  if (equipResult.length) {
    for (const row of equipResult[0].values) {
      const baseAttack = Number(row[0] || 0);
      const baseDefense = Number(row[1] || 0);
      const upgradeLevel = Number(row[2] || 0);
      const slotKey = String(row[3] || "");

      bonusAttack += baseAttack + upgradeLevel * 2;
      bonusDefense += baseDefense + upgradeLevel * 2;

      if (slotKey === "chest" || slotKey === "helmet" || slotKey === "boots") {
        bonusHp += 10 + upgradeLevel * 5;
      }

      if (slotKey === "amulet") {
        bonusHp += 20 + upgradeLevel * 5;
      }
    }
  }

  const strength = Number(attrs[0]);
  const dexterity = Number(attrs[1]);
  const intelligence = Number(attrs[2]);
  const vitality = Number(attrs[3]);

  return {
    player_id: Number(player[0]),
    nickname: player[1],
    class: player[2],
    level: Number(player[3]),
    xp: Number(player[4]),
    attributes: {
      strength,
      dexterity,
      intelligence,
      vitality
    },
    equipment_bonus: {
      bonus_attack: bonusAttack,
      bonus_defense: bonusDefense,
      bonus_hp: bonusHp
    },
    final_stats: {
      attack_power: strength * 2 + dexterity + bonusAttack,
      magic_power: intelligence * 2,
      max_hp: 100 + vitality * 20 + bonusHp,
      crit_chance: dexterity,
      defense: vitality * 2 + bonusDefense
    }
  };
}

module.exports = {
  getPlayerCombatProfile
};
