const { createPlayer, createMob, attack } = require("./combat_engine");
const { createProgressionPlayer, applyRewards } = require("./progression_system");
const { useSkill } = require("./skill_engine");
const { autoUsePotion } = require("./potion_engine");
const { addDropToInventory, countMaterial } = require("./inventory_engine");
const { rollDrop } = require("./drop_table");
const {
  createSectorPlayer,
  moveToSector,
  getSectorName,
  getSectorMobPool,
  getSectorDifficultyMultiplier,
  isBossSector,
  getSectorBoss
} = require("./sector_engine");

const MOB_BASE = {
  Slime: { name: "Slime", baseHp: 30, baseAtk: 3 },
  Wolf: { name: "Wolf", baseHp: 40, baseAtk: 5 },
  Goblin: { name: "Goblin", baseHp: 55, baseAtk: 7 },
  Orc: { name: "Orc", baseHp: 70, baseAtk: 9 },
  Skeleton: { name: "Skeleton", baseHp: 75, baseAtk: 10 },
  Dark_Wolf: { name: "Dark Wolf", baseHp: 80, baseAtk: 11 },
  Shadow_Knight: { name: "Shadow Knight", baseHp: 110, baseAtk: 15 },
  Phantom: { name: "Phantom", baseHp: 105, baseAtk: 16 },
  Abyss_Mage: { name: "Abyss Mage", baseHp: 95, baseAtk: 18 },
  Void_Beast: { name: "Void Beast", baseHp: 150, baseAtk: 22 },
  Chaos_Reaper: { name: "Chaos Reaper", baseHp: 160, baseAtk: 24 },
  Astral_Golem: { name: "Astral Golem", baseHp: 180, baseAtk: 20 },
  Galaxy_Beast: { name: "Galaxy Beast", baseHp: 240, baseAtk: 30 },
  Cosmic_Horror: { name: "Cosmic Horror", baseHp: 260, baseAtk: 33 },
  Star_Devourer: { name: "Star Devourer", baseHp: 300, baseAtk: 36 }
};

let combatInterval = null;
let progressionPlayer = null;
let combatPlayer = null;
let sectorPlayer = null;
let farmStage = 1;
let currentMob = null;

function normalizeKey(name) {
  return name.replace(/ /g, "_");
}

function getMobReward(mobName, stage) {
  const baseRewards = {
    Slime: { xp: 20, gold: 10 },
    Wolf: { xp: 35, gold: 18 },
    Goblin: { xp: 50, gold: 25 },
    Orc: { xp: 70, gold: 35 },
    Skeleton: { xp: 75, gold: 40 },
    "Dark Wolf": { xp: 80, gold: 45 },
    "Shadow Knight": { xp: 120, gold: 60 },
    Phantom: { xp: 115, gold: 62 },
    "Abyss Mage": { xp: 130, gold: 70 },
    "Void Beast": { xp: 180, gold: 95 },
    "Chaos Reaper": { xp: 190, gold: 105 },
    "Astral Golem": { xp: 200, gold: 110 },
    "Galaxy Beast": { xp: 260, gold: 150 },
    "Cosmic Horror": { xp: 280, gold: 170 },
    "Star Devourer": { xp: 320, gold: 190 }
  };

  const reward = baseRewards[mobName] || { xp: 10, gold: 5 };

  return {
    xp: reward.xp + (stage - 1) * 5,
    gold: reward.gold + (stage - 1) * 2
  };
}

function rollMobBySector(sector) {
  const pool = getSectorMobPool(sector);
  const mobName = pool[Math.floor(Math.random() * pool.length)];
  const key = normalizeKey(mobName);
  const base = MOB_BASE[key] || MOB_BASE.Slime;
  const multiplier = getSectorDifficultyMultiplier(sector);

  const mob = createMob(
    base.name,
    Math.floor(base.baseHp * multiplier),
    Math.floor(base.baseAtk * multiplier)
  );

  mob.sector = sector;
  return mob;
}

function createBossMob(sector) {
  const bossName = getSectorBoss(sector);
  const multiplier = getSectorDifficultyMultiplier(sector) * 2.2;

  const mob = createMob(
    bossName,
    Math.floor(250 * multiplier),
    Math.floor(22 * multiplier)
  );

  mob.sector = sector;
  mob.isBoss = true;

  return mob;
}

function logStatus() {
  const refineStones = countMaterial(progressionPlayer.inventory, "refine_stone");
  const manaCrystalF = countMaterial(progressionPlayer.inventory, "mana_crystal_f");
  const manaCrystalE = countMaterial(progressionPlayer.inventory, "mana_crystal_e");

  console.log(
    "📈 Status Hero | Level:",
    progressionPlayer.level,
    "| XP:",
    progressionPlayer.xp + "/" + progressionPlayer.xpToNextLevel,
    "| Gold:",
    progressionPlayer.gold,
    "| Stage:",
    farmStage,
    "| HP:",
    combatPlayer.hp + "/" + combatPlayer.maxHp,
    "| Setor:",
    sectorPlayer.sector
  );

  console.log(
    "🎒 Inventário | Equip:",
    progressionPlayer.inventory.equipments.length,
    "| Refine Stone:",
    refineStones,
    "| Crystal F:",
    manaCrystalF,
    "| Crystal E:",
    manaCrystalE
  );
}

function maybeAdvanceSector() {
  if (farmStage > 1 && farmStage % 3 === 1) {
    moveToSector(sectorPlayer, sectorPlayer.sector + 1);
    console.log("🗺️ Player moveu para setor", sectorPlayer.sector, "-", getSectorName(sectorPlayer.sector));
  }
}

function startNewMob() {
  console.log("🌍 Setor atual:", sectorPlayer.sector, "-", getSectorName(sectorPlayer.sector));

  if (isBossSector(sectorPlayer.sector)) {
    currentMob = createBossMob(sectorPlayer.sector);
    console.log("👑 Boss do setor:", currentMob.name);
  } else {
    currentMob = rollMobBySector(sectorPlayer.sector);
  }

  console.log(
    "➡️ Novo mob:",
    currentMob.name,
    "| HP:",
    currentMob.hp,
    "| ATK:",
    currentMob.atk,
    "| Setor:",
    currentMob.sector
  );
}

function mobAttackPlayer() {
  combatPlayer.hp -= currentMob.atk;

  if (combatPlayer.hp < 0) {
    combatPlayer.hp = 0;
  }

  console.log(
    "👾",
    currentMob.name,
    "causou",
    currentMob.atk,
    "de dano em Hero | HP Hero:",
    combatPlayer.hp
  );
}

function handleVictory() {
  const reward = getMobReward(currentMob.name, farmStage);
  const drop = rollDrop(currentMob.name);

  applyRewards(progressionPlayer, reward);

  const inventoryResult = addDropToInventory(progressionPlayer.inventory, drop);

  console.log("☠️", currentMob.name, "derrotado");
  console.log("⭐ XP ganho:", reward.xp);
  console.log("💰 Gold ganho:", reward.gold);
  console.log("🎁 Drop:", drop.name);
  console.log("📦 Item adicionado em:", inventoryResult.bucket);

  farmStage += 1;

  maybeAdvanceSector();
  logStatus();
  startNewMob();
}

function handleDefeat() {
  console.log("💀 Hero foi derrotado");
  clearInterval(combatInterval);
}

function startFarmEngine() {
  combatPlayer = createPlayer("Hero", 100, 8);
  combatPlayer.maxHp = 100;

  progressionPlayer = createProgressionPlayer("Hero");
  sectorPlayer = createSectorPlayer("Hero");

  farmStage = 1;

  console.log("🌾 Farm Engine iniciado");

  startNewMob();

  if (combatInterval) {
    clearInterval(combatInterval);
  }

  combatInterval = setInterval(() => {
    if (!currentMob) return;

    const useSpecial = farmStage % 3 === 0;

    if (useSpecial) {
      const skillResult = useSkill(combatPlayer, currentMob);

      console.log("🔥 Skill usada:", skillResult.skillName);

      if (skillResult.critical) {
        console.log("💥 Crítico!");
      }

      console.log(
        "⚔️ Hero causou",
        skillResult.damage,
        "de dano em",
        currentMob.name,
        "| HP restante:",
        skillResult.defenderHp
      );

      if (skillResult.defeated) {
        handleVictory();
        return;
      }
    } else {
      const result = attack(combatPlayer, currentMob);

      console.log(
        "⚔️ Hero causou",
        result.damage,
        "de dano em",
        result.defender,
        "| HP restante:",
        result.defenderHp
      );

      if (result.defeated) {
        handleVictory();
        return;
      }
    }

    mobAttackPlayer();

    if (combatPlayer.hp <= 0) {
      handleDefeat();
      return;
    }

    const potion = autoUsePotion(combatPlayer);

    if (potion.used) {
      console.log("🧪 Auto potion usada | HP restaurado para:", potion.hp);
    }
  }, 2000);
}

module.exports = {
  startFarmEngine,
  rollMobBySector,
  createBossMob
};
