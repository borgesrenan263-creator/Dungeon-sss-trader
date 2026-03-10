function randomWorldEvent() {

  const events = [
    "⚔ Invasão de monstros!",
    "💰 Evento de ouro dobrado!",
    "✨ Drop raro aumentado!",
    "🐉 Boss Galaxy apareceu!"
  ];

  const index = Math.floor(Math.random() * events.length);

  return events[index];
}

module.exports = {
  randomWorldEvent
};
