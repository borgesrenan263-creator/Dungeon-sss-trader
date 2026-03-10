const worldState = {
  playersOnline: [],
  activeMobs: [],
  activeBoss: null,
  activeEvents: []
};

function addMob(mob) {
  worldState.activeMobs.push(mob);
}

function removeMob(index) {
  worldState.activeMobs.splice(index, 1);
}

function setBoss(boss) {
  worldState.activeBoss = boss;
}

function clearBoss() {
  worldState.activeBoss = null;
}

function addEvent(event) {
  worldState.activeEvents.push(event);
}

function getWorldState() {
  return worldState;
}

module.exports = {
  addMob,
  removeMob,
  setBoss,
  clearBoss,
  addEvent,
  getWorldState
};
