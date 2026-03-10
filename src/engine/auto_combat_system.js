const { createPlayer, createMob, attack } = require("./combat_engine");
const { getMobReward } = require("./reward_system");
const { createProgressionPlayer, applyRewards } = require("./progression_system");

let currentMob = null;
let currentPlayer = null;
let progressionPlayer = null;

function startAutoCombat() {
  currentPlayer = createPlayer("Hero", 100, 8);
  progressionPlayer = createProgressionPlayer("Hero");
  currentMob = createMob("Slime", 30, 3);

  console.log("⚔️ Combate iniciado");
  console.log("👾 Mob encontrado:", currentMob.name, "| HP:", currentMob.hp);

  const interval = setInterval(() => {
    if (!currentMob || currentMob.hp <= 0) {
      clearInterval(interval);
      return;
    }

    const result = attack(currentPlayer, currentMob);

    console.log(
      "💥",
      result.attacker,
      "causou",
      result.damage,
      "de dano em",
      result.defender,
      "| HP restante:",
      result.defenderHp
    );

    if (result.defeated) {
      const reward = getMobReward(currentMob.name);
      applyRewards(progressionPlayer, reward);

      console.log("☠️", currentMob.name, "derrotado");
      console.log("⭐ XP ganho:", reward.xp);
      console.log("💰 Gold ganho:", reward.gold);
      console.log("🎁 Drop:", reward.drop);
      console.log(
        "📈 Status Hero | Level:",
        progressionPlayer.level,
        "| XP:",
        progressionPlayer.xp + "/" + progressionPlayer.xpToNextLevel,
        "| Gold:",
        progressionPlayer.gold
      );

      clearInterval(interval);
    }
  }, 2000);
}

module.exports = {
  startAutoCombat
};
