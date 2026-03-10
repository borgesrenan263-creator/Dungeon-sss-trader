const { getWorldState, removeMob } = require("./world.state");
const { grantXp } = require("../game/engine/xp.engine");

function attackMobByIndex(player, mobIndex) {

  const world = getWorldState();
  const mob = world.activeMobs[mobIndex];

  if (!mob) {
    return { ok:false };
  }

  const playerAtk = player.atk || 10;

  const damage = Math.max(1, playerAtk);

  mob.hp -= damage;

  if (mob.hp <= 0) {

    removeMob(mobIndex);

    const xpResult = grantXp(player, 20 + mob.zone * 5);

    return {
      ok:true,
      defeated:true,
      mob:mob.name,
      xp:xpResult
    };
  }

  return {
    ok:true,
    defeated:false,
    mob:mob.name,
    remainingHp:mob.hp
  };
}

module.exports = {
  attackMobByIndex
};
