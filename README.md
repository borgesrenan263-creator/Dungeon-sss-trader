# 🌌 Galaxy Isekai Protocol — Dungeon Trader Engine

Prototype MMORPG engine developed entirely on **mobile using Termux**.

This project is a technical prototype of an **MMO farming economy game** where players progress through sectors, defeat monsters, collect resources, and participate in a global economy.

---

# 🎮 Current Playable Systems

The project already includes a working gameplay loop.

Player Flow:

Create Character  
↓  
Hub  
↓  
World Map  
↓  
Enter Sector  
↓  
Combat Monsters  
↓  
Gain XP / Gold / Loot  
↓  
Return to Hub  

---

# ⚔️ Gameplay Systems Implemented

### Character System
- Character creation
- 3 playable classes
- Persistent player stats
- Level progression

Classes:

Cavaleiro — Tank  
Mago — Area Damage  
Caçador — Single Target / Speed  

---

### Combat Engine
- Monster spawning
- Turn-based combat
- Damage calculation
- Player death handling
- Respawn logic

---

### World Map
Dynamic sector system with level restrictions.

Example sectors:

Shadow Forest  
Ancient Ruins  
Crimson Caverns  
Obsidian Desert  
Eclipse Valley  
Storm Plateau  
Void Marsh  
Celestial Domain  
Abyss Gate  
Galaxy Rift  

Each sector has its own monster pool and level range.

---

### Loot System
Players receive rewards from combat.

Current drops include:

Mana Crystals  
Rare Crystals  
Potions  
Gold  

---

### Inventory System
The Hub displays player inventory:

Mana Crystals  
Rare Crystals  
Potions  

---

### Progression System
Players gain:

XP  
Levels  
Stats growth  

Leveling increases:

HP  
ATK  
DEF  
AGI  

---

# 💎 Economy Design (Galaxy Isekai Protocol)

The long-term game design introduces a **three-layer economy**.

### Soft Currency
Gold obtained by selling crystals.

### Limited Currency
Obsidian (max supply: 5,000,000)

### Player Market
USDT based player-to-player trading.

Developer tax: **10% per transaction**.

---

# 🔨 Planned Systems

Upcoming systems defined in the Game Design Document:

Crystal Economy  
NPC Crystal Market  
Equipment System  
Equipment Forge (+1 to +5)  
Obsidian Limited Currency  
Player Marketplace  
Top 10 Ranking System  
Galaxy World Boss Event  
School Domination System  

---

# 🐉 Galaxy World Boss

Global event every **10 days**.

Boss characteristics:

30 HP Layers  
10–20 players raid  
Boss regenerates if players fall below 10  

Main reward:

Galaxy Rune (permanent skill slot)

Reward is distributed via **lottery RNG** among participants.

---

# 🧠 Technical Stack

Backend

Node.js  
Express  

Frontend

HTML  
CSS  
Vanilla JavaScript  

Development Environment

Termux (Android mobile)  

---

# 🚀 Vision

Galaxy Isekai Protocol aims to become a **persistent MMO farming economy game** featuring:

Risk-reward gameplay  
Player driven economy  
Competitive ranking systems  
Global events  

---

# 👨‍💻 Developer

Renan Borges

GitHub  
https://github.com/renanborges-dev

---

# 📌 Project Status

Prototype Engine — In Development

