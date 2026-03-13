const status = document.getElementById("status");
const button = document.getElementById("createBtn");

button.onclick = async () => {
  status.innerText = "BOTÃO CLICADO";

  const nickname = document.getElementById("nickname").value.trim();
  const playerClass = document.getElementById("playerClass").value;

  if (!nickname) {
    status.innerText = "Digite um nome.";
    return;
  }

  status.innerText = "ENTRANDO...";

  try {
    const res = await fetch("/players/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: nickname,
        nickname,
        playerClass
      })
    });

    const raw = await res.text();

    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      status.innerText = "Resposta não é JSON:\n" + raw;
      return;
    }

    if (data.ok && data.player) {
      localStorage.setItem("playerName", data.player.name || data.player.nickname);
      status.innerText = "LOGIN OK";
      window.location.href = "/hub.html";
      return;
    }

    status.innerText = "Erro do servidor:\n" + JSON.stringify(data, null, 2);
  } catch (err) {
    status.innerText = "Falha de rede:\n" + err.message;
  }
};
