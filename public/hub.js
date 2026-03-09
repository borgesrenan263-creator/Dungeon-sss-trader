const playerCard = document.getElementById("playerCard");
const inventoryCard = document.getElementById("inventoryCard");
const mapBtn = document.getElementById("mapBtn");
const healBtn = document.getElementById("healBtn");
const logoutBtn = document.getElementById("logoutBtn");

let player = null;

try {
  player = JSON.parse(localStorage.getItem("player"));
} catch (e) {
  playerCard.innerText = "Erro lendo player";
}

if (!player) {
  playerCard.innerText = "Nenhum personagem encontrado";
  inventoryCard.innerText = "Sem inventário";
} else {
  if (!player.maxHp) player.maxHp = player.hp || 100;
  if (!player.xp) player.xp = 0;
  if (!player.manaCrystals) player.manaCrystals = 0;
  if (!player.rareCrystals) player.rareCrystals = 0;
  if (!player.potions) player.potions = 0;

  playerCard.innerHTML = `
    <h2>${player.nickname}</h2>
    <p>Classe: ${player.class}</p>
    <p>Level: ${player.level}</p>
    <p>HP: ${player.hp}/${player.maxHp}</p>
    <p>Gold: ${player.gold}</p>
    <p>XP: ${player.xp}</p>
  `;

  inventoryCard.innerHTML = `
    <h2>🎒 Inventário</h2>
    <p>Cristais de Mana: ${player.manaCrystals}</p>
    <p>Cristais Raros: ${player.rareCrystals}</p>
    <p>Poções: ${player.potions}</p>
  `;
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
    localStorage.setItem("player", JSON.stringify(player));
    window.location.reload();
  };
}

if (logoutBtn) {
  logoutBtn.onclick = () => {
    localStorage.removeItem("player");
    window.location.href = "/";
  };
}
