const playerCard = document.getElementById("playerCard");
const inventoryCard = document.getElementById("inventoryCard");
const attributeCard = document.getElementById("attributeCard");
const crystalCard = document.getElementById("crystalCard");
const crystalSellCard = document.getElementById("crystalSellCard");
const equippedCard = document.getElementById("equippedCard");
const bagCard = document.getElementById("bagCard");
const forgeCard = document.getElementById("forgeCard");
const hubLog = document.getElementById("hubLog");

const mapBtn = document.getElementById("mapBtn");
const healBtn = document.getElementById("healBtn");
const logoutBtn = document.getElementById("logoutBtn");

let player = null;

const CRYSTAL_VALUES = {
  F: 50,
  E: 200,
  D: 600,
  C: 1500,
  B: 4000,
  A: 8000,
  SS: 15000
};

const FORGE_RULES = {
  0: { next: 1, chance: 90, gold: 500, rare: 1 },
  1: { next: 2, chance: 70, gold: 1200, rare: 1 },
  2: { next: 3, chance: 40, gold: 2500, rare: 2 },
  3: { next: 4, chance: 20, gold: 5000, rare: 3 },
  4: { next: 5, chance: 10, gold: 10000, rare: 5 }
};

function logHub(msg) {
  hubLog.textContent += "\n" + msg;
}

function getBaseStatsByClass(playerClass) {
  if (playerClass === "Cavaleiro") return { maxHp: 140, atk: 12, def: 16, agi: 6 };
  if (playerClass === "Mago") return { maxHp: 95, atk: 18, def: 8, agi: 9 };
  return { maxHp: 110, atk: 15, def: 10, agi: 14 };
}

function getSellValue(rarity) {
  if (rarity === "Lendário") return 900;
  if (rarity === "Épico") return 350;
  if (rarity === "Raro") return 120;
  return 40;
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

function ensurePlayerShape(p) {
  const base = getBaseStatsByClass(p.class);

  if (!p.maxHp) p.maxHp = p.hp || base.maxHp;
  if (!p.hp) p.hp = p.maxHp;
  if (!p.xp) p.xp = 0;
  if (!p.manaCrystals) p.manaCrystals = 0;
  if (!p.rareCrystals) p.rareCrystals = 0;
  if (!p.potions) p.potions = 0;
  if (!p.equipmentBag) p.equipmentBag = [];
  if (!p.equipped) {
    p.equipped = { weapon: null, armor: null, accessory: null };
  }

  if (!p.baseStats) {
    p.baseStats = {
      maxHp: base.maxHp,
      atk: base.atk,
      def: base.def,
      agi: base.agi
    };
  }

  ensureCrystalBag(p);
  ensureAttributes(p);

  p.equipmentBag.forEach(ensureForgeData);
  ["weapon","armor","accessory"].forEach(slot => {
    if (p.equipped[slot]) ensureForgeData(p.equipped[slot]);
  });

  recalcStats();
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

function displayItemName(item) {
  const refine = item.refineLevel > 0 ? ` +${item.refineLevel}` : "";
  return `${item.name}${refine}`;
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

function savePlayer() {
  localStorage.setItem("player", JSON.stringify(player));
}

function crystalTotalCount() {
  return Object.values(player.crystals).reduce((sum, val) => sum + val, 0);
}

function allocatePoint(statKey, label) {
  if (!player || player.unspentPoints <= 0) {
    logHub("Sem pontos disponíveis para " + label + ".");
    return;
  }

  player.attributes[statKey] += 1;
  player.unspentPoints -= 1;

  recalcStats();
  savePlayer();
  renderAll();
  logHub("1 ponto aplicado em " + label + ".");
}

function renderAttributes() {
  const attrBonus = getAttributeBonus();

  attributeCard.innerHTML = `
    <div class="crystalLine"><b>Pontos disponíveis:</b> ${player.unspentPoints}</div>
    <div class="attrRow">
      <div class="attrInfo">
        <b>FOR</b><br>
        Valor: ${player.attributes.str}<br>
        Bônus atual: +${attrBonus.atk} ATK
      </div>
      <div class="attrActions">
        <button class="attrBtn" id="addStrBtn">+ FOR</button>
      </div>
    </div>

    <div class="attrRow">
      <div class="attrInfo">
        <b>DEF</b><br>
        Valor: ${player.attributes.def}<br>
        Bônus atual: +${attrBonus.def} DEF
      </div>
      <div class="attrActions">
        <button class="attrBtn" id="addDefBtn">+ DEF</button>
      </div>
    </div>

    <div class="attrRow">
      <div class="attrInfo">
        <b>AGI</b><br>
        Valor: ${player.attributes.agi}<br>
        Bônus atual: +${attrBonus.agi} AGI
      </div>
      <div class="attrActions">
        <button class="attrBtn" id="addAgiBtn">+ AGI</button>
      </div>
    </div>

    <div class="attrRow">
      <div class="attrInfo">
        <b>VIT</b><br>
        Valor: ${player.attributes.vit}<br>
        Bônus atual: +${attrBonus.hp} HP
      </div>
      <div class="attrActions">
        <button class="attrBtn" id="addVitBtn">+ VIT</button>
      </div>
    </div>
  `;

  document.getElementById("addStrBtn").onclick = () => allocatePoint("str", "FOR");
  document.getElementById("addDefBtn").onclick = () => allocatePoint("def", "DEF");
  document.getElementById("addAgiBtn").onclick = () => allocatePoint("agi", "AGI");
  document.getElementById("addVitBtn").onclick = () => allocatePoint("vit", "VIT");
}

function renderPlayer() {
  playerCard.innerHTML = `
    <h2>${player.nickname}</h2>
    <p>Classe: ${player.class}</p>
    <p>Level: ${player.level}</p>
    <p>HP: ${player.hp}/${player.maxHp}</p>
    <p>ATK: ${player.atk}</p>
    <p>DEF: ${player.def}</p>
    <p>AGI: ${player.agi}</p>
    <p>Gold: ${player.gold}</p>
    <p>XP: ${player.xp}</p>
  `;

  inventoryCard.innerHTML = `
    <h2>🎒 Inventário Geral</h2>
    <p>Total de Cristais por Rank: ${crystalTotalCount()}</p>
    <p>Cristais Raros: ${player.rareCrystals}</p>
    <p>Poções: ${player.potions}</p>
    <p>Itens na Mochila: ${player.equipmentBag.length}</p>
  `;
}

function renderCrystals() {
  crystalCard.innerHTML = `
    <div class="crystalLine">Rank F (Cinza): ${player.crystals.F}</div>
    <div class="crystalLine">Rank E (Verde): ${player.crystals.E}</div>
    <div class="crystalLine">Rank D (Azul): ${player.crystals.D}</div>
    <div class="crystalLine">Rank C (Roxo): ${player.crystals.C}</div>
    <div class="crystalLine">Rank B (Vermelho): ${player.crystals.B}</div>
    <div class="crystalLine">Rank A (Dourado): ${player.crystals.A}</div>
    <div class="crystalLine">Rank SS (Branco Estelar): ${player.crystals.SS}</div>
  `;
}

function sellCrystal(rank) {
  const amount = player.crystals[rank] || 0;
  if (amount <= 0) {
    logHub("Você não possui cristais rank " + rank + " para vender.");
    return;
  }

  const value = CRYSTAL_VALUES[rank] * amount;
  player.gold += value;
  player.crystals[rank] = 0;

  savePlayer();
  renderAll();
  logHub("Vendidos " + amount + " cristal(is) rank " + rank + " por " + value + " ouro.");
}

function renderCrystalSell() {
  crystalSellCard.innerHTML = "";

  ["F","E","D","C","B","A","SS"].forEach(rank => {
    const div = document.createElement("div");
    div.className = "crystalLine";

    div.innerHTML = `
      <b>Rank ${rank}</b><br>
      Quantidade: ${player.crystals[rank]}<br>
      Valor unitário: ${CRYSTAL_VALUES[rank]} ouro
    `;

    const btn = document.createElement("button");
    btn.className = "sellCrystalBtn";
    btn.textContent = "Vender Rank " + rank;
    btn.addEventListener("click", () => sellCrystal(rank));

    div.appendChild(btn);
    crystalSellCard.appendChild(div);
  });
}

function renderEquipped() {
  const slots = [
    { key: "weapon", name: "Arma" },
    { key: "armor", name: "Armadura" },
    { key: "accessory", name: "Acessório" }
  ];

  equippedCard.innerHTML = "";

  slots.forEach((slot) => {
    const item = player.equipped[slot.key];
    const div = document.createElement("div");
    div.className = "slot";

    if (!item) {
      div.innerHTML = `<b>${slot.name}</b><br>Vazio`;
    } else {
      const refine = getRefineBonus(item);
      div.innerHTML = `
        <b>${slot.name}</b><br>
        ${displayItemName(item)}<br>
        Raridade: ${item.rarity}<br>
        +HP ${(item.bonusHp || 0) + refine.bonusHp} | +ATK ${(item.bonusAtk || 0) + refine.bonusAtk} | +DEF ${(item.bonusDef || 0) + refine.bonusDef} | +AGI ${(item.bonusAgi || 0) + refine.bonusAgi}
      `;
    }

    equippedCard.appendChild(div);
  });
}

function equipItem(index) {
  const item = player.equipmentBag[index];
  if (!item) return;

  const previous = player.equipped[item.slot];
  if (previous) {
    player.equipmentBag.push(previous);
  }

  player.equipped[item.slot] = item;
  player.equipmentBag.splice(index, 1);

  recalcStats();
  savePlayer();
  renderAll();
  logHub("Equipado: " + displayItemName(item));
}

function sellItem(index) {
  const item = player.equipmentBag[index];
  if (!item) return;

  const value = getSellValue(item.rarity);
  player.gold += value;
  player.equipmentBag.splice(index, 1);

  savePlayer();
  renderAll();
  logHub("Vendido: " + displayItemName(item) + " por " + value + " ouro.");
}

function tryForge(index) {
  const item = player.equipmentBag[index];
  if (!item) return;

  const current = item.refineLevel || 0;
  if (current >= 5) {
    logHub(displayItemName(item) + " já está no refino máximo.");
    return;
  }

  const rule = FORGE_RULES[current];
  if (!rule) return;

  if (player.gold < rule.gold) {
    logHub("Ouro insuficiente para refinar " + displayItemName(item) + ".");
    return;
  }

  if ((player.rareCrystals || 0) < rule.rare) {
    logHub("Cristais raros insuficientes para refinar " + displayItemName(item) + ".");
    return;
  }

  player.gold -= rule.gold;
  player.rareCrystals -= rule.rare;

  const success = Math.random() * 100 < rule.chance;

  if (success) {
    item.refineLevel = rule.next;
    savePlayer();
    renderAll();
    logHub("SUCESSO! " + item.name + " foi refinado para +" + item.refineLevel + ".");
    return;
  }

  if (rule.next >= 4) {
    player.equipmentBag.splice(index, 1);
    savePlayer();
    renderAll();
    logHub("FALHA CRÍTICA! " + item.name + " quebrou na tentativa de +" + rule.next + ".");
    return;
  }

  savePlayer();
  renderAll();
  logHub("Falha no refino de " + item.name + " para +" + rule.next + ".");
}

function renderBag() {
  bagCard.innerHTML = "";

  if (player.equipmentBag.length === 0) {
    bagCard.innerHTML = "Nenhum equipamento encontrado ainda.";
    return;
  }

  player.equipmentBag.forEach((item, index) => {
    const refine = getRefineBonus(item);

    const div = document.createElement("div");
    div.className = "item";

    div.innerHTML = `
      <b>${displayItemName(item)}</b><br>
      Slot: ${item.slot}<br>
      Raridade: ${item.rarity}<br>
      Valor de venda: ${getSellValue(item.rarity)} ouro<br>
      +HP ${(item.bonusHp || 0) + refine.bonusHp} | +ATK ${(item.bonusAtk || 0) + refine.bonusAtk} | +DEF ${(item.bonusDef || 0) + refine.bonusDef} | +AGI ${(item.bonusAgi || 0) + refine.bonusAgi}
    `;

    const equipBtn = document.createElement("button");
    equipBtn.className = "equipBtn";
    equipBtn.textContent = "Equipar";
    equipBtn.addEventListener("click", () => equipItem(index));

    const sellBtn = document.createElement("button");
    sellBtn.className = "sellBtn";
    sellBtn.textContent = "Vender";
    sellBtn.addEventListener("click", () => sellItem(index));

    const forgeBtn = document.createElement("button");
    forgeBtn.className = "forgeBtn";
    const current = item.refineLevel || 0;
    forgeBtn.textContent = current >= 5 ? "Máximo +5" : "Refinar +" + (current + 1);
    forgeBtn.disabled = current >= 5;
    forgeBtn.addEventListener("click", () => tryForge(index));

    div.appendChild(equipBtn);
    div.appendChild(sellBtn);
    div.appendChild(forgeBtn);
    bagCard.appendChild(div);
  });
}

function renderForge() {
  forgeCard.innerHTML = `
    <div class="crystalLine">+1 = 90% | 500 ouro | 1 cristal raro</div>
    <div class="crystalLine">+2 = 70% | 1200 ouro | 1 cristal raro</div>
    <div class="crystalLine">+3 = 40% | 2500 ouro | 2 cristais raros</div>
    <div class="crystalLine">+4 = 20% | 5000 ouro | 3 cristais raros | quebra se falhar</div>
    <div class="crystalLine">+5 = 10% | 10000 ouro | 5 cristais raros | quebra se falhar</div>
  `;
}

function renderAll() {
  renderPlayer();
  renderAttributes();
  renderCrystals();
  renderCrystalSell();
  renderEquipped();
  renderBag();
  renderForge();
}

try {
  player = JSON.parse(localStorage.getItem("player"));
} catch (e) {
  playerCard.innerText = "Erro lendo player";
}

if (!player) {
  playerCard.innerText = "Nenhum personagem encontrado";
  inventoryCard.innerText = "Sem inventário";
  attributeCard.innerText = "Sem atributos";
  crystalCard.innerText = "Sem cristais";
  crystalSellCard.innerText = "Sem comércio";
  equippedCard.innerText = "Sem equipamentos";
  bagCard.innerText = "Sem mochila";
  forgeCard.innerText = "Sem forja";
} else {
  ensurePlayerShape(player);
  savePlayer();
  renderAll();
}

if (mapBtn) {
  mapBtn.onclick = () => {
    window.location.href = "/world.html";
  };
}

if (healBtn) {
  healBtn.onclick = () => {
    if (!player) return;
    player.hp = player.maxHp;
    savePlayer();
    renderAll();
    logHub("Você descansou no Hub e recuperou todo o HP.");
  };
}

if (logoutBtn) {
  logoutBtn.onclick = () => {
    localStorage.removeItem("player");
    window.location.href = "/";
  };
}
