const { createPlayer, createMob, attack } = require("./combat_engine");
const { getMobReward } = require("./reward_system");
const { createProgressionPlayer, applyRewards } = require("./progression_system");
const { useSkill } = require("./skill_engine");
const { autoUsePotion } = require("./potion_engine");
const { createWorldPlayer, getZone, moveToZone, getZoneMobPool } = require("./world_engine");

const MOB_BASE = {
  Slime:  { name: "Slime",  baseHp: 30, baseAtk: 3 },
  Wolf:   { name: "Wolf",   baseHp: 40, baseAtk: 5 },
  Goblin: { name: "Goblin", baseHp: 55, baseAtk: 7 }
};

let combatInterval = null;
let progressionPlayer = null;
let combatPlayer = null;
let worldPlayer = null;
let farmStage = 1;
let currentMob = null;

function rollMobByStage(stage, zoneId = 1) {
  const zonePool = getZoneMobPool(zoneId);
  const mobName = zonePool[Math.floor(Math.random() * zonePool.length)];
  const mobBase = MOB_BASE[mobName] || MOB_BASE.Slime;

  const hp = mobBase.baseHp + (stage - 1) * 8;
  const atk = mobBase.baseAtk + Math.floor((stage - 1) / 2);

  const mob = createMob(mobBase.name, hp, atk);
  mob.zone = zoneId;

  return mob;
}

function logStatus() {
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
    "| Zona:",
    worldPlayer.zone
  );
}

function maybeChangeZone() {
  if (farmStage === 4) {
    const moved = moveToZone(worldPlayer, 2);
    console.log("🗺️ Player moveu para zona", moved.zone.id, "-", moved.zone.name);
  }

  if (farmStage === 7) {
    const moved = moveToZone(worldPlayer, 3);
    console.log("🗺️ Player moveu para zona", moved.zone.id, "-", moved.zone.name);
  }
}

function startNewMob() {
  const zone = getZone(worldPlayer.zone);
  currentMob = rollMobByStage(farmStage, worldPlayer.zone);

  console.log("🌍 Zona atual:", zone.name);
  console.log(
    "➡️ Novo mob:",
    currentMob.name,
    "| HP:",
    currentMob.hp,
    "| ATK:",
    currentMob.atk,
    "| Zona:",
    currentMob.zone
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
  const reward = getMobReward(currentMob.name);

  reward.xp += (farmStage - 1) * 5;
  reward.gold += (farmStage - 1) * 2;

  applyRewards(progressionPlayer, reward);

  console.log("☠️", currentMob.name, "derrotado");
  console.log("⭐ XP ganho:", reward.xp);
  console.log("💰 Gold ganho:", reward.gold);
  console.log("🎁 Drop:", reward.drop);

  farmStage += 1;

  maybeChangeZone();
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
  worldPlayer = createWorldPlayer("Hero");

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
  rollMobByStage
};
