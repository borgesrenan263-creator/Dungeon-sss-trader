function rollCritical(chance = 0.2) {
  return Math.random() < chance;
}

function useSkill(attacker, defender) {
  const skillName = "Power Slash";

  const baseDamage = attacker.atk || 1;

  let damage = baseDamage + 4;
  let critical = false;

  if (rollCritical()) {
    damage *= 2;
    critical = true;
  }

  defender.hp -= damage;

  if (defender.hp < 0) {
    defender.hp = 0;
  }

  return {
    skillName,
    damage,
    critical,
    defenderHp: defender.hp,
    defeated: defender.hp === 0
  };
}

module.exports = {
  rollCritical,
  useSkill
};
