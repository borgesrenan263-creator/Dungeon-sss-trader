const status = document.getElementById("status");
const btn = document.getElementById("createBtn");

status.innerText = "SCRIPT EXECUTOU";

btn.onclick = async () => {
  status.innerText = "BOTÃO CLICADO";

  const nickname = document.getElementById("nickname").value.trim();
  const playerClass = document.getElementById("playerClass").value;

  if (!nickname) {
    status.innerText = "Digite um nome.";
    return;
  }

  status.innerText = "ENVIANDO...";

  try {
    const res = await fetch("/player/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
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
      localStorage.setItem("player", JSON.stringify(data.player));
      status.innerText = "PERSONAGEM CRIADO";
      window.location.href = "/hub.html";
      return;
    }

    status.innerText = "Erro do servidor:\n" + JSON.stringify(data, null, 2);
  } catch (err) {
    status.innerText = "Falha de rede:\n" + err.message;
  }
};
