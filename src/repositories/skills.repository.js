const { initDB, saveDB } = require("../config/database");
const { createEvent } = require("./events.repository");

const BASE_SKILLS = [
  {
    skill_key: "fireball",
    skill_name: "Fireball",
    class_name: "Mago",
    required_level: 1,
    mana_cost: 20,
    cooldown_seconds: 5,
    base_damage: 40,
    scaling_attr: "intelligence",
    description: "Launches a fire projectile with magic scaling."
  },
  {
    skill_key: "mana_burst",
    skill_name: "Mana Burst",
    class_name: "Mago",
    required_level: 2,
    mana_cost: 30,
    cooldown_seconds: 8,
    base_damage: 70,
    scaling_attr: "intelligence",
    description: "Explosive magic burst with high arcane damage."
  },
  {
    skill_key: "arcane_shield",
    skill_name: "Arcane Shield",
    class_name: "Mago",
    required_level: 3,
    mana_cost: 25,
    cooldown_seconds: 12,
    base_damage: 0,
    scaling_attr: "intelligence",
    description: "Creates a magical shield and grants defensive advantage."
  },
  {
    skill_key: "power_strike",
    skill_name: "Power Strike",
    class_name: "Cavaleiro",
    required_level: 1,
    mana_cost: 10,
    cooldown_seconds: 4,
    base_damage: 35,
    scaling_attr: "strength",
    description: "A heavy strike empowered by strength."
  },
  {
    skill_key: "iron_guard",
    skill_name: "Iron Guard",
    class_name: "Cavaleiro",
    required_level: 2,
    mana_cost: 15,
    cooldown_seconds: 10,
    base_damage: 0,
    scaling_attr: "vitality",
    description: "Defensive stance that reinforces body and armor."
  },
  {
    skill_key: "earth_breaker",
    skill_name: "Earth Breaker",
    class_name: "Cavaleiro",
    required_level: 3,
    mana_cost: 25,
    cooldown_seconds: 9,
    base_damage: 65,
    scaling_attr: "strength",
    description: "Crushes the ground and damages the target heavily."
  },
  {
    skill_key: "double_shot",
    skill_name: "Double Shot",
    class_name: "Caçador",
    required_level: 1,
    mana_cost: 15,
    cooldown_seconds: 4,
    base_damage: 30,
    scaling_attr: "dexterity",
    description: "Shoots twice with accuracy and speed."
  },
  {
    skill_key: "hunter_trap",
    skill_name: "Hunter Trap",
    class_name: "Caçador",
    required_level: 2,
    mana_cost: 20,
    cooldown_seconds: 8,
    base_damage: 45,
    scaling_attr: "dexterity",
    description: "Sets a trap that deals burst damage."
  },
  {
    skill_key: "falcon_focus",
    skill_name: "Falcon Focus",
    class_name: "Caçador",
    required_level: 3,
    mana_cost: 20,
    cooldown_seconds: 10,
    base_damage: 55,
    scaling_attr: "dexterity",
    description: "Focus shot with higher precision and lethal effect."
  }
];

async function ensureSkillsTables() {
  const db = await initDB();

  db.run(`
    CREATE TABLE IF NOT EXISTS skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      skill_key TEXT UNIQUE NOT NULL,
      skill_name TEXT NOT NULL,
      class_name TEXT NOT NULL,
      required_level INTEGER DEFAULT 1,
      mana_cost INTEGER DEFAULT 0,
      cooldown_seconds INTEGER DEFAULT 0,
      base_damage INTEGER DEFAULT 0,
      scaling_attr TEXT NOT NULL,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS player_skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER NOT NULL,
      skill_id INTEGER NOT NULL,
      learned_at TEXT DEFAULT CURRENT_TIMESTAMP,
      last_used_at TEXT,
      UNIQUE(player_id, skill_id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS skill_loadout (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER NOT NULL,
      slot_number INTEGER NOT NULL,
      skill_id INTEGER NOT NULL,
      equipped_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(player_id, slot_number)
    )
  `);

  saveDB();
}

async function seedSkills() {
  const db = await initDB();

  for (const skill of BASE_SKILLS) {
    const existing = db.exec(
      `SELECT id FROM skills WHERE skill_key = ?`,
      [skill.skill_key]
    );

    if (existing.length && existing[0].values.length) continue;

    db.run(
      `INSERT INTO skills (
        skill_key,
        skill_name,
        class_name,
        required_level,
        mana_cost,
        cooldown_seconds,
        base_damage,
        scaling_attr,
        description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        skill.skill_key,
        skill.skill_name,
        skill.class_name,
        skill.required_level,
        skill.mana_cost,
        skill.cooldown_seconds,
        skill.base_damage,
        skill.scaling_attr,
        skill.description
      ]
    );
  }

  saveDB();
}

async function listSkillsByClass(className) {
  const db = await initDB();

  const result = db.exec(
    `SELECT id, skill_key, skill_name, class_name, required_level, mana_cost, cooldown_seconds, base_damage, scaling_attr, description
     FROM skills
     WHERE class_name = ?
     ORDER BY required_level ASC, id ASC`,
    [String(className)]
  );

  if (!result.length) return [];

  return result[0].values.map((row) => ({
    skill_id: row[0],
    skill_key: row[1],
    skill_name: row[2],
    class_name: row[3],
    required_level: row[4],
    mana_cost: row[5],
    cooldown_seconds: row[6],
    base_damage: row[7],
    scaling_attr: row[8],
    description: row[9]
  }));
}

async function getPlayerSkills(playerId) {
  const db = await initDB();

  const learned = db.exec(
    `SELECT ps.id, ps.player_id, ps.skill_id, s.skill_key, s.skill_name, s.class_name, s.required_level,
            s.mana_cost, s.cooldown_seconds, s.base_damage, s.scaling_attr, ps.learned_at, ps.last_used_at
     FROM player_skills ps
     INNER JOIN skills s ON s.id = ps.skill_id
     WHERE ps.player_id = ?
     ORDER BY s.required_level ASC, ps.id ASC`,
    [Number(playerId)]
  );

  const loadout = db.exec(
    `SELECT sl.slot_number, sl.skill_id, s.skill_name, s.skill_key
     FROM skill_loadout sl
     INNER JOIN skills s ON s.id = sl.skill_id
     WHERE sl.player_id = ?
     ORDER BY sl.slot_number ASC`,
    [Number(playerId)]
  );

  const learnedSkills = !learned.length
    ? []
    : learned[0].values.map((row) => ({
        id: row[0],
        player_id: row[1],
        skill_id: row[2],
        skill_key: row[3],
        skill_name: row[4],
        class_name: row[5],
        required_level: row[6],
        mana_cost: row[7],
        cooldown_seconds: row[8],
        base_damage: row[9],
        scaling_attr: row[10],
        learned_at: row[11],
        last_used_at: row[12]
      }));

  const equipped = !loadout.length
    ? []
    : loadout[0].values.map((row) => ({
        slot_number: row[0],
        skill_id: row[1],
        skill_name: row[2],
        skill_key: row[3]
      }));

  return {
    player_id: Number(playerId),
    learned_skills: learnedSkills,
    equipped_skills: equipped
  };
}

async function learnSkill({ playerId, skillId }) {
  const db = await initDB();

  const playerResult = db.exec(
    `SELECT id, nickname, class, level
     FROM players
     WHERE id = ?`,
    [Number(playerId)]
  );

  if (!playerResult.length || !playerResult[0].values.length) {
    throw new Error("player not found");
  }

  const player = playerResult[0].values[0];

  const skillResult = db.exec(
    `SELECT id, skill_name, class_name, required_level
     FROM skills
     WHERE id = ?`,
    [Number(skillId)]
  );

  if (!skillResult.length || !skillResult[0].values.length) {
    throw new Error("skill not found");
  }

  const skill = skillResult[0].values[0];

  if (String(player[2]) !== String(skill[2])) {
    throw new Error("skill does not belong to player class");
  }

  if (Number(player[3]) < Number(skill[3])) {
    throw new Error("player level too low for this skill");
  }

  const existing = db.exec(
    `SELECT id
     FROM player_skills
     WHERE player_id = ?
       AND skill_id = ?`,
    [Number(playerId), Number(skillId)]
  );

  if (existing.length && existing[0].values.length) {
    throw new Error("skill already learned");
  }

  db.run(
    `INSERT INTO player_skills (
      player_id,
      skill_id,
      learned_at
    ) VALUES (?, ?, CURRENT_TIMESTAMP)`,
    [Number(playerId), Number(skillId)]
  );

  saveDB();

  await createEvent({
    eventType: "skill_learned",
    title: "Skill Learned",
    message: `🧠 ${player[1]} learned ${skill[1]}`,
    metadata: {
      player_id: Number(playerId),
      skill_id: Number(skillId)
    }
  });

  return {
    player_id: Number(playerId),
    skill_id: Number(skillId),
    skill_name: skill[1]
  };
}

async function equipSkill({ playerId, skillId, slotNumber }) {
  const db = await initDB();

  const safeSlot = Number(slotNumber);
  if (safeSlot < 1 || safeSlot > 4) {
    throw new Error("slot number must be between 1 and 4");
  }

  const learned = db.exec(
    `SELECT id
     FROM player_skills
     WHERE player_id = ?
       AND skill_id = ?`,
    [Number(playerId), Number(skillId)]
  );

  if (!learned.length || !learned[0].values.length) {
    throw new Error("skill not learned by player");
  }

  const existingSlot = db.exec(
    `SELECT id
     FROM skill_loadout
     WHERE player_id = ?
       AND slot_number = ?`,
    [Number(playerId), safeSlot]
  );

  if (existingSlot.length && existingSlot[0].values.length) {
    db.run(
      `UPDATE skill_loadout
       SET skill_id = ?,
           equipped_at = CURRENT_TIMESTAMP
       WHERE player_id = ?
         AND slot_number = ?`,
      [Number(skillId), Number(playerId), safeSlot]
    );
  } else {
    db.run(
      `INSERT INTO skill_loadout (
        player_id,
        slot_number,
        skill_id,
        equipped_at
      ) VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
      [Number(playerId), safeSlot, Number(skillId)]
    );
  }

  saveDB();

  return {
    player_id: Number(playerId),
    skill_id: Number(skillId),
    slot_number: safeSlot
  };
}

async function getScalingValue(playerId, scalingAttr) {
  const db = await initDB();

  const result = db.exec(
    `SELECT strength, dexterity, intelligence, vitality
     FROM character_progression
     WHERE player_id = ?`,
    [Number(playerId)]
  );

  if (!result.length || !result[0].values.length) {
    return 0;
  }

  const row = result[0].values[0];

  if (scalingAttr === "strength") return Number(row[0]);
  if (scalingAttr === "dexterity") return Number(row[1]);
  if (scalingAttr === "intelligence") return Number(row[2]);
  if (scalingAttr === "vitality") return Number(row[3]);

  return 0;
}

async function castSkill({ playerId, skillId }) {
  const db = await initDB();

  const learned = db.exec(
    `SELECT ps.id, ps.last_used_at, s.skill_name, s.mana_cost, s.cooldown_seconds, s.base_damage, s.scaling_attr
     FROM player_skills ps
     INNER JOIN skills s ON s.id = ps.skill_id
     WHERE ps.player_id = ?
       AND ps.skill_id = ?`,
    [Number(playerId), Number(skillId)]
  );

  if (!learned.length || !learned[0].values.length) {
    throw new Error("skill not learned by player");
  }

  const skill = learned[0].values[0];

  const scalingValue = await getScalingValue(playerId, String(skill[6]));
  const finalDamage = Number(skill[5]) + scalingValue * 3;

  db.run(
    `UPDATE player_skills
     SET last_used_at = CURRENT_TIMESTAMP
     WHERE player_id = ?
       AND skill_id = ?`,
    [Number(playerId), Number(skillId)]
  );

  saveDB();

  return {
    player_id: Number(playerId),
    skill_id: Number(skillId),
    skill_name: skill[2],
    mana_cost: Number(skill[3]),
    cooldown_seconds: Number(skill[4]),
    base_damage: Number(skill[5]),
    scaling_attr: skill[6],
    scaling_value: scalingValue,
    final_damage: finalDamage
  };
}

module.exports = {
  ensureSkillsTables,
  seedSkills,
  listSkillsByClass,
  getPlayerSkills,
  learnSkill,
  equipSkill,
  castSkill
};
