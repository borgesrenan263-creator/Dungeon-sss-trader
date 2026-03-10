const sectorNameEl = document.getElementById("sectorName");
const sectorRangeEl = document.getElementById("sectorRange");
const playerInfoEl = document.getElementById("playerInfo");
const playerExtraEl = document.getElementById("playerExtra");
const monsterInfoEl = document.getElementById("monsterInfo");
const combatStateEl = document.getElementById("combatState");
const logEl = document.getElementById("log");

const spawnBtn = document.getElementById("spawnBtn");
const attackBtn = document.getElementById("attackBtn");
const skill1Btn = document.getElementById("skill1Btn");
const skill2Btn = document.getElementById("skill2Btn");
const potionBtn = document.getElementById("potionBtn");
const autoAttackBtn = document.getElementById("autoAttackBtn");
const autoPotionBtn = document.getElementById("autoPotionBtn");
const fleeBtn = document.getElementById("fleeBtn");
const hubBtn = document.getElementById("hubBtn");

const deathOverlay = document.getElementById("deathOverlay");
const deathText = document.getElementById("deathText");

const params = new URLSearchParams(window.location.search);
const sectorId = Number(params.get("sectorId"));

let sector = null;
let player = null;
let monster = null;
let respawnTimer = null;
let isDead = false;

let autoAttackOn = false;
let autoPotionOn = false;
let autoAttackTimer = null;
let monsterAggroTimer = null;

let activeBuffs = {
  defBoostUntil: 0,
  shieldUntil: 0,
  agiBoostUntil: 0
};

let skillCooldowns = {
  skill1: 0,
  skill2: 0
};

const CRYSTAL_DROP_WEIGHTS = [
  { rank: "SS", chance: 5 },
  { rank: "A", chance: 20 },
  { rank: "B", chance: 20 },
  { rank: "C", chance: 35 },
  { rank: "D", chance: 50 },
  { rank: "E", chance: 70 },
  { rank: "F", chance: 90 }
];

function now() {
  return Date.now();
}

function log(msg) {
  logEl.textContent += "\n" + msg;
}

function savePlayer() {
  localStorage.setItem("player", JSON.stringify(player));
}

function setButtonsDisabled(state) {
  spawnBtn.disabled = state;
  attackBtn.disabled = state;
  skill1Btn.disabled = state;
  skill2Btn.disabled = state;
  potionBtn.disabled = state;
  autoAttackBtn.disabled = state;
  autoPotionBtn.disabled = state;
  fleeBtn.disabled = state;
  hubBtn.disabled = state;
}

function getBaseStatsByClass(playerClass) {
  if (playerClass === "Cavaleiro") return { maxHp: 140, atk: 12, def: 16, agi: 6 };
  if (playerClass === "Mago") return { maxHp: 95, atk: 18, def: 8, agi: 9 };
  return { maxHp: 110, atk: 15, def: 10, agi: 14 };
}

function ensureCrystalBag(p) {
  if (!p.crystals) {
    p.crystals = { F: 0, E: 0, D: 0, C: 0, B: 0, A: 0, SS: 0 };
  }

  ["F","E","D","C","B","A","SS"].forEach(rank => {
    if (!p.crystals[rank]) p.crystals[rank] = 0;
  });
}

function ensureForgeData(item) {
  if (item.refineLevel === undefined || item.refineLevel === null) item.refineLevel = 0;
}

function ensureAttributes(p) {
  if (!p.attributes) {
    p.attributes = {
      str: 0,
      def: 0,
      agi: 0,
      vit: 0
    };
  }

  if (typeof p.attributes.str !== "number") p.attributes.str = 0;
  if (typeof p.attributes.def !== "number") p.attributes.def = 0;
  if (typeof p.attributes.agi !== "number") p.attributes.agi = 0;
  if (typeof p.attributes.vit !== "number") p.attributes.vit = 0;

  if (typeof p.unspentPoints !== "number") {
    const bonusFromLevels = Math.max(0, (p.level || 1) - 1) * 5;
    const spent =
      p.attributes.str +
      p.attributes.def +
      p.attributes.agi +
      p.attributes.vit;
    p.unspentPoints = Math.max(0, bonusFromLevels - spent);
  }
}

function ensurePlayerShape(rawPlayer) {
  const base = getBaseStatsByClass(rawPlayer.class);

  if (!rawPlayer.xp) rawPlayer.xp = 0;
  if (!rawPlayer.manaCrystals) rawPlayer.manaCrystals = 0;
  if (!rawPlayer.rareCrystals) rawPlayer.rareCrystals = 0;
  if (!rawPlayer.potions) rawPlayer.potions = 0;
  if (!rawPlayer.equipmentBag) rawPlayer.equipmentBag = [];
  if (!rawPlayer.equipped) {
    rawPlayer.equipped = { weapon: null, armor: null, accessory: null };
  }

  if (!rawPlayer.baseStats) {
    rawPlayer.baseStats = {
      maxHp: base.maxHp,
      atk: base.atk,
      def: base.def,
      agi: base.agi
    };
  }

  ensureCrystalBag(rawPlayer);
  ensureAttributes(rawPlayer);

  rawPlayer.equipmentBag.forEach(ensureForgeData);
  ["weapon","armor","accessory"].forEach(slot => {
    if (rawPlayer.equipped[slot]) ensureForgeData(rawPlayer.equipped[slot]);
  });

  player = rawPlayer;
  recalcStats();

  if (!player.hp || player.hp > player.maxHp) {
    player.hp = player.maxHp;
  }
}

function getRefineBonus(item) {
  const lvl = item.refineLevel || 0;
  return {
    bonusHp: Math.floor((item.bonusHp || 0) * 0.25 * lvl),
    bonusAtk: Math.floor((item.bonusAtk || 0) * 0.5 * lvl),
    bonusDef: Math.floor((item.bonusDef || 0) * 0.5 * lvl),
    bonusAgi: Math.floor((item.bonusAgi || 0) * 0.5 * lvl)
  };
}

function getAttributeBonus() {
  return {
    hp: player.attributes.vit * 12,
    atk: player.attributes.str * 2,
    def: player.attributes.def * 2,
    agi: player.attributes.agi * 2
  };
}

function getBuffedDef() {
  let val = player.def;
  if (activeBuffs.defBoostUntil > now()) {
    val += Math.floor(player.def * 0.5);
  }
  return val;
}

function getBuffedAgi() {
  let val = player.agi;
  if (activeBuffs.agiBoostUntil > now()) {
    val += Math.floor(player.agi * 0.5);
  }
  return val;
}

function recalcStats() {
  const base = player.baseStats;
  const eq = player.equipped;
  const attr = getAttributeBonus();

  let bonusHp = 0;
  let bonusAtk = 0;
  let bonusDef = 0;
  let bonusAgi = 0;

  ["weapon", "armor", "accessory"].forEach((slot) => {
    const item = eq[slot];
    if (!item) return;

    const refine = getRefineBonus(item);

    bonusHp += (item.bonusHp || 0) + refine.bonusHp;
    bonusAtk += (item.bonusAtk || 0) + refine.bonusAtk;
    bonusDef += (item.bonusDef || 0) + refine.bonusDef;
    bonusAgi += (item.bonusAgi || 0) + refine.bonusAgi;
  });

  const oldRatio = player.maxHp > 0 ? player.hp / player.maxHp : 1;

  player.maxHp = base.maxHp + bonusHp + attr.hp;
  player.atk = base.atk + bonusAtk + attr.atk;
  player.def = base.def + bonusDef + attr.def;
  player.agi = base.agi + bonusAgi + attr.agi;

  player.hp = Math.min(player.maxHp, Math.max(1, Math.round(player.maxHp * oldRatio)));
}

function getSkillLabels() {
  if (player.class === "Cavaleiro") {
    return {
      skill1: "Golpe Pesado",
      skill2: "Postura Defensiva"
    };
  }

  if (player.class === "Mago") {
    return {
      skill1: "Explosão Arcana",
      skill2: "Escudo Místico"
    };
  }

  return {
    skill1: "Tiro Preciso",
    skill2: "Passo Fantasma"
  };
}

function updateSkillButtons() {
  const labels = getSkillLabels();

  const cd1 = Math.max(0, Math.ceil((skillCooldowns.skill1 - now()) / 1000));
  const cd2 = Math.max(0, Math.ceil((skillCooldowns.skill2 - now()) / 1000));

  skill1Btn.textContent = cd1 > 0 ? `${labels.skill1} (${cd1}s)` : labels.skill1;
  skill2Btn.textContent = cd2 > 0 ? `${labels.skill2} (${cd2}s)` : labels.skill2;

  skill1Btn.disabled = isDead || cd1 > 0;
  skill2Btn.disabled = isDead || cd2 > 0;
}

function renderPlayer() {
  playerInfoEl.innerHTML = `
<b>${player.nickname}</b><br>
Classe: ${player.class}<br>
Level: ${player.level}<br>
HP: ${player.hp}/${player.maxHp}
`;

  const defBuff = activeBuffs.defBoostUntil > now() ? " (buff)" : "";
  const agiBuff = activeBuffs.agiBoostUntil > now() ? " (buff)" : "";
  const shieldBuff = activeBuffs.shieldUntil > now() ? "<br>Escudo Místico: ATIVO" : "";

  playerExtraEl.innerHTML = `
ATK: ${player.atk}<br>
DEF: ${getBuffedDef()}${defBuff}<br>
AGI: ${getBuffedAgi()}${agiBuff}<br>
Gold: ${player.gold}<br>
XP: ${player.xp}<br>
Pontos livres: ${player.unspentPoints}<br>
FOR: ${player.attributes.str}<br>
DEF Attr: ${player.attributes.def}<br>
AGI Attr: ${player.attributes.agi}<br>
VIT: ${player.attributes.vit}<br>
Poções: ${player.potions}<br>
Itens: ${player.equipmentBag.length}<br>
Cristais Raros: ${player.rareCrystals}<br>
Cristais F: ${player.crystals.F}<br>
Cristais E: ${player.crystals.E}<br>
Cristais D: ${player.crystals.D}<br>
Cristais C: ${player.crystals.C}<br>
Cristais B: ${player.crystals.B}<br>
Cristais A: ${player.crystals.A}<br>
Cristais SS: ${player.crystals.SS}${shieldBuff}
`;
}

function renderMonster() {
  if (!monster) {
    monsterInfoEl.innerHTML = "Nenhum monstro ativo.";
    combatStateEl.innerHTML = `Aguardando spawn.<br>Auto Attack: ${autoAttackOn ? "ON" : "OFF"}<br>Auto Poção: ${autoPotionOn ? "ON" : "OFF"}`;
    return;
  }

  monsterInfoEl.innerHTML = `
<b>${monster.name}</b><br>
Level: ${monster.level}<br>
HP: ${monster.hp}/${monster.maxHp}<br>
ATK: ${monster.atk}<br>
DEF: ${monster.def}
`;

  combatStateEl.innerHTML = `
Setor: ${sector.name}<br>
Combate em andamento<br>
Auto Attack: ${autoAttackOn ? "ON" : "OFF"}<br>
Auto Poção: ${autoPotionOn ? "ON" : "OFF"}
`;
}

function updateAutoButtons() {
  autoAttackBtn.textContent = "Auto Attack: " + (autoAttackOn ? "ON" : "OFF");
  autoPotionBtn.textContent = "Auto Poção: " + (autoPotionOn ? "ON" : "OFF");
}

function getMonsterPoolBySectorName(name) {
  const pools = {
    "Shadow Forest": ["Goblin", "Lobo Sombrio", "Slime Verde"],
    "Ancient Ruins": ["Esqueleto", "Morcego Ancião", "Guardião de Pedra"],
    "Crimson Caverns": ["Aranha Rubra", "Morcego Carmesim", "Cultista Perdido"],
    "Obsidian Desert": ["Escorpião Negro", "Bandido do Deserto", "Serpente de Areia"],
    "Eclipse Valley": ["Fantasma Lunar", "Predador Eclipse", "Arqueiro das Sombras"],
    "Storm Plateau": ["Harpia Tempestade", "Golem de Trovão", "Lanceiro do Vento"],
    "Void Marsh": ["Limo do Vazio", "Sapo Corrompido", "Bruxa do Pântano"],
    "Celestial Domain": ["Sentinela Celestial", "Anjo Caído", "Guardião Astral"],
    "Abyss Gate": ["Demônio Menor", "Arauto do Abismo", "Cavaleiro Infernal"],
    "Galaxy Rift": ["Devorador Estelar", "Avatar do Rift", "Fragmento Cósmico"]
  };

  return pools[name] || ["Monstro Selvagem"];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFrom(arr) {
  return arr[randomInt(0, arr.length - 1)];
}

function getSectorTierById(id) {
  return Math.max(1, Number(id || 1));
}

function createMonster() {
  const names = getMonsterPoolBySectorName(sector.name);

  const sectorTier = getSectorTierById(sector.id);
  const baseSectorLevel = sector.level_min;
  const randomSectorLevel = randomInt(0, Math.max(2, Math.floor((sector.level_max - sector.level_min) / 5)));

  const playerInfluence = Math.floor(player.level * 0.55);
  const sectorInfluence = sectorTier * 6;
  const overlevelBoost = Math.max(0, player.level - sector.level_min);

  const finalLevel = Math.max(
    sector.level_min,
    baseSectorLevel + randomSectorLevel + Math.floor(sectorInfluence / 3) + Math.floor(playerInfluence / 2)
  );

  const hpBase =
    30 +
    (sectorTier * 16) +
    (finalLevel * 5) +
    Math.floor(player.level * 3) +
    Math.floor(overlevelBoost * 2);

  const atkBase =
    6 +
    sectorTier * 2 +
    Math.floor(finalLevel * 0.9) +
    Math.floor(player.level * 0.45);

  const defBase =
    3 +
    sectorTier +
    Math.floor(finalLevel * 0.45) +
    Math.floor(player.level * 0.25);

  return {
    name: randomFrom(names),
    level: finalLevel,
    hp: hpBase,
    maxHp: hpBase,
    atk: atkBase,
    def: defBase
  };
}

function createEquipmentDrop() {
  const rarityRoll = randomInt(1, 100);

  let rarity = "Comum";
  let mult = 1;

  if (rarityRoll <= 55) {
    rarity = "Comum";
    mult = 1;
  } else if (rarityRoll <= 85) {
    rarity = "Raro";
    mult = 1.5;
  } else if (rarityRoll <= 97) {
    rarity = "Épico";
    mult = 2.2;
  } else {
    rarity = "Lendário";
    mult = 3;
  }

  const slot = randomFrom(["weapon", "armor", "accessory"]);

  const namesBySlot = {
    weapon: ["Espada de Ferro", "Cajado Arcano", "Arco de Caça", "Lâmina Sombria"],
    armor: ["Armadura de Couro", "Armadura de Ferro", "Manto Arcano", "Peitoral Estelar"],
    accessory: ["Anel de Poder", "Amuleto da Lua", "Pingente de Defesa", "Bracelete Ágil"]
  };

  const base = Math.max(1, Math.floor(monster.level / 8));

  return {
    name: randomFrom(namesBySlot[slot]) + " [" + rarity + "]",
    slot,
    rarity,
    refineLevel: 0,
    bonusHp: slot === "armor" ? Math.floor(base * 10 * mult) : 0,
    bonusAtk: slot === "weapon" ? Math.floor(base * 3 * mult) : 0,
    bonusDef: slot === "armor" ? Math.floor(base * 3 * mult) : 0,
    bonusAgi: slot === "accessory" ? Math.floor(base * 2 * mult) : 0
  };
}

function rollCrystalRank() {
  const eligible = CRYSTAL_DROP_WEIGHTS.filter(entry => randomInt(1, 100) <= entry.chance);

  if (sector.id === 10 && randomInt(1, 100) <= 5) {
    return "SS";
  }

  if (eligible.length === 0) {
    return "F";
  }

  return eligible[0].rank;
}

function xpNeeded() {
  return player.level * 25;
}

function maybeLevelUp() {
  while (player.xp >= xpNeeded()) {
    player.xp -= xpNeeded();
    player.level += 1;
    player.unspentPoints += 5;
    player.baseStats.maxHp += 12;
    player.baseStats.atk += 2;
    player.baseStats.def += 1;
    player.baseStats.agi += 1;
    recalcStats();
    player.hp = player.maxHp;
    log("LEVEL UP! Agora você é level " + player.level + " e ganhou +5 pontos de atributo.");
  }
}

function getDamage(attackerAtk, defenderDef) {
  const raw = attackerAtk - Math.floor(defenderDef * 0.35) + randomInt(0, 4);
  return Math.max(2, raw);
}

function clearMonsterAggroTimer() {
  if (monsterAggroTimer) {
    clearTimeout(monsterAggroTimer);
    monsterAggroTimer = null;
  }
}

function scheduleMonsterAggro() {
  clearMonsterAggroTimer();

  if (!monster || isDead) return;

  monsterAggroTimer = setTimeout(() => {
    if (!monster || isDead) return;
    monsterTurn("O monstro aproveitou sua hesitação!");
  }, 3000);
}

function scheduleRespawn() {
  if (respawnTimer) clearTimeout(respawnTimer);

  combatStateEl.innerHTML = `Setor: ${sector.name}<br>Próximo monstro chegando...<br>Auto Attack: ${autoAttackOn ? "ON" : "OFF"}<br>Auto Poção: ${autoPotionOn ? "ON" : "OFF"}`;

  respawnTimer = setTimeout(() => {
    if (isDead) return;
    monster = createMonster();
    renderMonster();
    log("Novo monstro apareceu: " + monster.name + " (Lv " + monster.level + ")");
    scheduleMonsterAggro();
  }, 1800);
}

function tryAutoPotion() {
  if (!autoPotionOn || isDead || !player) return false;
  if ((player.potions || 0) <= 0) return false;

  const hpPercent = player.hp / player.maxHp;
  if (hpPercent > 0.45) return false;

  const healAmount = Math.floor(player.maxHp * 0.35);
  player.potions -= 1;
  player.hp = Math.min(player.maxHp, player.hp + healAmount);

  savePlayer();
  renderPlayer();
  log("AUTO POÇÃO ativado! HP recuperado: +" + healAmount);
  return true;
}

function handleDeath() {
  isDead = true;

  if (respawnTimer) {
    clearTimeout(respawnTimer);
    respawnTimer = null;
  }

  clearMonsterAggroTimer();

  if (autoAttackTimer) {
    clearInterval(autoAttackTimer);
    autoAttackTimer = null;
  }

  setButtonsDisabled(true);

  const defeatedBy = monster ? monster.name : "um inimigo";
  log("Você foi derrotado por " + defeatedBy + ".");
  log("Retornando ao Hub...");

  deathText.textContent = "Você foi derrotado por " + defeatedBy + ". Retornando ao Hub...";
  deathOverlay.classList.add("show");

  monster = null;
  renderMonster();

  player.hp = player.maxHp;
  savePlayer();

  setTimeout(() => {
    window.location.href = "/hub.html?death=1";
  }, 2000);
}

function handleVictory() {
  clearMonsterAggroTimer();

  const xpGain = 8 + Math.floor(monster.level / 2);
  const goldGain = 5 + Math.floor(monster.level / 3);
  const crystalRank = rollCrystalRank();

  player.xp += xpGain;
  player.gold += goldGain;
  player.crystals[crystalRank] += 1;

  log(monster.name + " foi derrotado!");
  log("Loot: +" + goldGain + " gold, +1 cristal rank " + crystalRank + ", +" + xpGain + " XP");

  const potionRoll = randomInt(1, 100);
  if (potionRoll <= 18) {
    player.potions += 1;
    log("Você encontrou +1 Poção");
  }

  const rareRoll = randomInt(1, 100);
  if (rareRoll <= 12) {
    player.rareCrystals += 1;
    log("DROP RARO! +1 Cristal Raro");
  }

  const equipmentRoll = randomInt(1, 100);
  if (equipmentRoll <= 22) {
    const equipment = createEquipmentDrop();
    player.equipmentBag.push(equipment);
    log("EQUIPAMENTO DROPADO! " + equipment.name);
  }

  maybeLevelUp();
  savePlayer();

  monster = null;
  renderPlayer();
  renderMonster();
  updateSkillButtons();
  scheduleRespawn();
}

function monsterTurn(prefix = "") {
  if (!monster || isDead) return;

  if (prefix) log(prefix);

  tryAutoPotion();

  let incomingDamage = getDamage(monster.atk, getBuffedDef());

  if (activeBuffs.shieldUntil > now()) {
    incomingDamage = Math.max(0, Math.floor(incomingDamage * 0.5));
  }

  player.hp = Math.max(0, player.hp - incomingDamage);
  log(monster.name + " causou " + incomingDamage + " de dano.");

  if (player.hp <= 0) {
    renderPlayer();
    handleDeath();
    return;
  }

  savePlayer();
  renderPlayer();
  renderMonster();
  updateSkillButtons();
  scheduleMonsterAggro();
}

function playerAttack(multiplier = 1) {
  if (isDead) return;

  if (!monster || monster.hp <= 0) {
    log("Nenhum monstro ativo.");
    return;
  }

  clearMonsterAggroTimer();

  const playerDamage = Math.max(2, Math.floor(getDamage(player.atk, monster.def) * multiplier));
  monster.hp = Math.max(0, monster.hp - playerDamage);
  log(player.nickname + " causou " + playerDamage + " de dano.");

  if (monster.hp <= 0) {
    handleVictory();
    return;
  }

  renderMonster();
  monsterTurn();
}

function useSkill1() {
  if (isDead || !monster) {
    log("Nenhum monstro ativo.");
    return;
  }

  if (skillCooldowns.skill1 > now()) {
    log("Skill 1 ainda em recarga.");
    return;
  }

  if (player.class === "Cavaleiro") {
    log("Golpe Pesado ativado!");
    skillCooldowns.skill1 = now() + 5000;
    updateSkillButtons();
    playerAttack(2.0);
    return;
  }

  if (player.class === "Mago") {
    log("Explosão Arcana ativada!");
    skillCooldowns.skill1 = now() + 6000;
    updateSkillButtons();
    playerAttack(2.3);
    return;
  }

  log("Tiro Preciso ativado!");
  skillCooldowns.skill1 = now() + 4000;
  updateSkillButtons();
  playerAttack(2.2);
}

function useSkill2() {
  if (isDead) return;

  if (skillCooldowns.skill2 > now()) {
    log("Skill 2 ainda em recarga.");
    return;
  }

  if (player.class === "Cavaleiro") {
    activeBuffs.defBoostUntil = now() + 4000;
    skillCooldowns.skill2 = now() + 8000;
    log("Postura Defensiva ativada! Defesa elevada por 4s.");
  } else if (player.class === "Mago") {
    activeBuffs.shieldUntil = now() + 5000;
    skillCooldowns.skill2 = now() + 10000;
    log("Escudo Místico ativado! Dano reduzido por 5s.");
  } else {
    activeBuffs.agiBoostUntil = now() + 3000;
    skillCooldowns.skill2 = now() + 7000;
    log("Passo Fantasma ativado! Agilidade elevada por 3s.");
  }

  renderPlayer();
  renderMonster();
  updateSkillButtons();

  if (monster && monster.hp > 0) {
    clearMonsterAggroTimer();
    scheduleMonsterAggro();
  }
}

function startAutoAttackLoop() {
  if (autoAttackTimer) clearInterval(autoAttackTimer);

  autoAttackTimer = setInterval(() => {
    if (!autoAttackOn || isDead) return;
    if (!monster || monster.hp <= 0) return;
    playerAttack();
  }, 1600);
}

setInterval(() => {
  if (isDead) return;
  renderPlayer();
  renderMonster();
  updateSkillButtons();
}, 500);

async function loadSector() {
  const saved = JSON.parse(localStorage.getItem("player") || "null");

  if (!saved) {
    window.location.href = "/";
    return;
  }

  ensurePlayerShape(saved);

  const res = await fetch("/world");
  const data = await res.json();

  if (!data.ok) {
    sectorNameEl.textContent = "Erro carregando setor";
    return;
  }

  sector = data.world.world_sectors.find(s => Number(s.id) === sectorId);

  if (!sector) {
    sectorNameEl.textContent = "Setor não encontrado";
    return;
  }

  if (player.level < sector.level_min) {
    alert("Seu level é insuficiente para esse setor.");
    window.location.href = "/world.html";
    return;
  }

  sectorNameEl.textContent = sector.name;
  sectorRangeEl.textContent = "Level " + sector.level_min + " - " + sector.level_max;

  updateAutoButtons();
  updateSkillButtons();
  renderPlayer();
  renderMonster();

  log("Entrando no setor...");
  log("Setor carregado: " + sector.name);
  log("Procure um monstro para iniciar o farm.");
}

spawnBtn.onclick = () => {
  if (!sector || isDead) return;

  if (respawnTimer) {
    clearTimeout(respawnTimer);
    respawnTimer = null;
  }

  clearMonsterAggroTimer();

  if (!monster) {
    monster = createMonster();
    renderMonster();
    log("Monstro encontrado: " + monster.name + " (Lv " + monster.level + ")");
    scheduleMonsterAggro();
    return;
  }

  if (monster.hp > 0) {
    log("Você já está em combate.");
    return;
  }
};

attackBtn.onclick = () => {
  playerAttack();
};

skill1Btn.onclick = () => {
  useSkill1();
};

skill2Btn.onclick = () => {
  useSkill2();
};

potionBtn.onclick = () => {
  if (isDead) return;
  if (!player) return;

  if ((player.potions || 0) <= 0) {
    log("Você não possui poções.");
    return;
  }

  if (player.hp >= player.maxHp) {
    log("Seu HP já está cheio.");
    return;
  }

  clearMonsterAggroTimer();

  const healAmount = Math.floor(player.maxHp * 0.35);
  player.potions -= 1;
  player.hp = Math.min(player.maxHp, player.hp + healAmount);

  savePlayer();
  renderPlayer();
  log("Poção usada! HP recuperado: +" + healAmount);

  if (monster && monster.hp > 0) {
    scheduleMonsterAggro();
  }
};

autoAttackBtn.onclick = () => {
  if (isDead) return;

  autoAttackOn = !autoAttackOn;
  updateAutoButtons();
  renderMonster();

  log("Auto Attack " + (autoAttackOn ? "ativado." : "desativado."));

  if (autoAttackOn) {
    startAutoAttackLoop();
  } else if (autoAttackTimer) {
    clearInterval(autoAttackTimer);
    autoAttackTimer = null;
  }
};

autoPotionBtn.onclick = () => {
  if (isDead) return;

  autoPotionOn = !autoPotionOn;
  updateAutoButtons();
  renderMonster();
  log("Auto Poção " + (autoPotionOn ? "ativada." : "desativada."));
};

fleeBtn.onclick = () => {
  if (isDead) return;

  clearMonsterAggroTimer();

  if (!monster) {
    log("Não há combate para fugir.");
    return;
  }

  log("Você fugiu do combate.");
  monster = null;
  renderMonster();
};

hubBtn.onclick = () => {
  if (respawnTimer) {
    clearTimeout(respawnTimer);
    respawnTimer = null;
  }

  clearMonsterAggroTimer();

  if (autoAttackTimer) {
    clearInterval(autoAttackTimer);
    autoAttackTimer = null;
  }

  savePlayer();
  window.location.href = "/hub.html";
};

loadSector();
