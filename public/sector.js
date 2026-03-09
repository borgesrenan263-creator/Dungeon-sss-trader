const sectorNameEl = document.getElementById("sectorName");
const sectorRangeEl = document.getElementById("sectorRange");
const playerInfoEl = document.getElementById("playerInfo");
const playerExtraEl = document.getElementById("playerExtra");
const monsterInfoEl = document.getElementById("monsterInfo");
const combatStateEl = document.getElementById("combatState");
const logEl = document.getElementById("log");

const spawnBtn = document.getElementById("spawnBtn");
const attackBtn = document.getElementById("attackBtn");
const fleeBtn = document.getElementById("fleeBtn");
const hubBtn = document.getElementById("hubBtn");

const params = new URLSearchParams(window.location.search);
const sectorId = Number(params.get("sectorId"));

let sector = null;
let player = null;
let monster = null;
let respawnTimer = null;

function log(msg) {
  logEl.textContent += "\n" + msg;
}

function savePlayer() {
  localStorage.setItem("player", JSON.stringify(player));
}

function ensurePlayerShape(rawPlayer) {
  return {
    id: rawPlayer.id,
    nickname: rawPlayer.nickname,
    class: rawPlayer.class,
    level: rawPlayer.level || 1,
    hp: rawPlayer.hp || 100,
    maxHp: rawPlayer.maxHp || rawPlayer.hp || 100,
    gold: rawPlayer.gold || 0,
    xp: rawPlayer.xp || 0,
    manaCrystals: rawPlayer.manaCrystals || 0,
    rareCrystals: rawPlayer.rareCrystals || 0,
    potions: rawPlayer.potions || 0,
    atk: rawPlayer.atk || inferAtk(rawPlayer),
    def: rawPlayer.def || inferDef(rawPlayer),
    agi: rawPlayer.agi || inferAgi(rawPlayer)
  };
}

function inferAtk(p) {
  if (p.class === "Cavaleiro") return 12;
  if (p.class === "Mago") return 18;
  return 15;
}

function inferDef(p) {
  if (p.class === "Cavaleiro") return 16;
  if (p.class === "Mago") return 8;
  return 10;
}

function inferAgi(p) {
  if (p.class === "Cavaleiro") return 6;
  if (p.class === "Mago") return 9;
  return 14;
}

function renderPlayer() {
  playerInfoEl.innerHTML = `
<b>${player.nickname}</b><br>
Classe: ${player.class}<br>
Level: ${player.level}<br>
HP: ${player.hp}/${player.maxHp}
`;

  playerExtraEl.innerHTML = `
ATK: ${player.atk}<br>
DEF: ${player.def}<br>
AGI: ${player.agi}<br>
Gold: ${player.gold}<br>
XP: ${player.xp}<br>
Cristais: ${player.manaCrystals}<br>
Raros: ${player.rareCrystals}<br>
Poções: ${player.potions}
`;
}

function renderMonster() {
  if (!monster) {
    monsterInfoEl.innerHTML = "Nenhum monstro ativo.";
    combatStateEl.innerHTML = "Aguardando spawn.";
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
Combate em andamento
`;
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

function createMonster() {
  const names = getMonsterPoolBySectorName(sector.name);
  const level = Math.max(1, randomInt(sector.level_min, Math.min(sector.level_max, sector.level_min + 8)));
  const baseHp = 20 + level * 2;
  const baseAtk = 4 + Math.floor(level / 6);
  const baseDef = 2 + Math.floor(level / 10);

  return {
    name: names[randomInt(0, names.length - 1)],
    level,
    hp: baseHp,
    maxHp: baseHp,
    atk: baseAtk,
    def: baseDef
  };
}

function xpNeeded() {
  return player.level * 25;
}

function maybeLevelUp() {
  while (player.xp >= xpNeeded()) {
    player.xp -= xpNeeded();
    player.level += 1;
    player.maxHp += 12;
    player.hp = player.maxHp;
    player.atk += 2;
    player.def += 1;
    player.agi += 1;
    log("LEVEL UP! Agora você é level " + player.level);
  }
}

function getDamage(attackerAtk, defenderDef) {
  return Math.max(1, attackerAtk - Math.floor(defenderDef / 2) + randomInt(0, 3));
}

function scheduleRespawn() {
  if (respawnTimer) clearTimeout(respawnTimer);

  combatStateEl.innerHTML = `Setor: ${sector.name}<br>Próximo monstro chegando...`;

  respawnTimer = setTimeout(() => {
    monster = createMonster();
    renderMonster();
    log("Novo monstro apareceu: " + monster.name + " (Lv " + monster.level + ")");
  }, 1800);
}

function handleVictory() {
  const xpGain = 8 + Math.floor(monster.level / 2);
  const goldGain = 5 + Math.floor(monster.level / 3);
  const crystalGain = randomInt(1, 3);

  player.xp += xpGain;
  player.gold += goldGain;
  player.manaCrystals += crystalGain;

  log(monster.name + " foi derrotado!");
  log("Loot: +" + goldGain + " gold, +" + crystalGain + " cristal(is), +" + xpGain + " XP");

  const rareRoll = randomInt(1, 100);
  if (rareRoll <= 12) {
    player.rareCrystals += 1;
    log("DROP RARO! +1 Cristal Raro");
  }

  const potionRoll = randomInt(1, 100);
  if (potionRoll <= 18) {
    player.potions += 1;
    log("Você encontrou +1 Poção");
  }

  maybeLevelUp();
  savePlayer();

  monster = null;
  renderPlayer();
  renderMonster();
  scheduleRespawn();
}

async function loadSector() {
  const saved = JSON.parse(localStorage.getItem("player") || "null");

  if (!saved) {
    window.location.href = "/";
    return;
  }

  player = ensurePlayerShape(saved);

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

  renderPlayer();
  renderMonster();

  log("Entrando no setor...");
  log("Setor carregado: " + sector.name);
  log("Procure um monstro para iniciar o farm.");
}

spawnBtn.onclick = () => {
  if (!sector) return;

  if (respawnTimer) {
    clearTimeout(respawnTimer);
    respawnTimer = null;
  }

  if (monster && monster.hp > 0) {
    log("Você já está em combate.");
    return;
  }

  monster = createMonster();
  renderMonster();
  log("Monstro encontrado: " + monster.name + " (Lv " + monster.level + ")");
};

attackBtn.onclick = () => {
  if (!monster || monster.hp <= 0) {
    log("Nenhum monstro ativo.");
    return;
  }

  if (player.hp <= 0) {
    log("Seu personagem está derrotado. Volte ao hub.");
    return;
  }

  const playerDamage = getDamage(player.atk, monster.def);
  monster.hp = Math.max(0, monster.hp - playerDamage);
  log(player.nickname + " causou " + playerDamage + " de dano.");

  if (monster.hp <= 0) {
    handleVictory();
    return;
  }

  const monsterDamage = getDamage(monster.atk, player.def);
  player.hp = Math.max(0, player.hp - monsterDamage);
  log(monster.name + " causou " + monsterDamage + " de dano.");

  if (player.hp <= 0) {
    log("Você foi derrotado e retornará ao hub com HP restaurado.");
    player.hp = player.maxHp;
    savePlayer();
    renderPlayer();
    monster = null;
    renderMonster();
    return;
  }

  savePlayer();
  renderPlayer();
  renderMonster();
};

fleeBtn.onclick = () => {
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
  savePlayer();
  window.location.href = "/hub.html";
};

loadSector();
