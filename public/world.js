async function loadWorld() {
  const res = await fetch("/world");
  const data = await res.json();

  const map = document.getElementById("map");
  map.innerHTML = "";

  if (!data.ok) {
    map.innerHTML = "Erro carregando mundo";
    return;
  }

  const player = JSON.parse(localStorage.getItem("player") || "null");

  data.world.world_sectors.forEach((sector) => {
    const div = document.createElement("div");
    div.className = "zone";

    const title = document.createElement("h3");
    title.textContent = sector.name;

    const range = document.createElement("p");
    range.textContent = `Level ${sector.level_min} - ${sector.level_max}`;

    const btn = document.createElement("button");

    if (player && player.level < sector.level_min) {
      btn.textContent = `Requer Lv ${sector.level_min}`;
      btn.disabled = true;
    } else {
      btn.textContent = "Entrar";
      btn.addEventListener("click", () => {
        window.location.href = "/sector.html?sectorId=" + sector.id;
      });
    }

    div.appendChild(title);
    div.appendChild(range);
    div.appendChild(btn);

    map.appendChild(div);
  });
}

loadWorld();
