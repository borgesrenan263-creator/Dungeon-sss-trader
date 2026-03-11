# Dungeon SSS Trader

Backend architecture for a simulated MMORPG economy and world engine.

This project implements the core server-side systems of an online RPG including combat, loot, equipment, refine mechanics, world simulation and a player-driven market.

The goal of the project is to study backend architecture, modular game engines and automated testing.

---

# Architecture Diagram

```mermaid
flowchart TD
    A[Player / Client] --> B[REST API - Express]

    B --> C[Player Routes]
    B --> D[World Routes]
    B --> E[WorldMap Routes]
    B --> F[Galaxy Boss Routes]
    B --> G[Equipment Routes]
    B --> H[Market Routes]

    C --> I[Game State]
    D --> I
    E --> I
    F --> I
    G --> I
    H --> I

    I --> J[Combat Engine]
    I --> K[Farm Engine]
    I --> L[Sector Engine]
    I --> M[World Loop Engine]
    I --> N[AI Economy Engine]
    I --> O[Galaxy Boss Engine]
    I --> P[Equipment Engine]
    I --> Q[Refine System]
    I --> R[Loot System]
    I --> S[Reward System]
    I --> T[Potion Engine]
    I --> U[School System]
    I --> V[Market Engine]
Architecture Overview
Player / Client ↓ REST API (Express) ↓ Game State ↓ Game Engines
Core engines:
Combat Engine
Farm Engine
Sector Engine
World Loop Engine
AI Economy Engine
Galaxy Boss Engine
Equipment Engine
Refine System
Loot System
Reward System
Potion Engine
Market Engine
Game Systems Implemented
World Simulation
Continuous world tick
Dynamic mob spawn
Global events
Sector based map
Economy tick loop
Combat System
Auto combat loop
Damage calculation
Potion auto-heal
Enemy spawn logic
Equipment System
Weapons and armor
Equip / unequip mechanics
Player stat calculation
Refine System
Equipment upgrade system (+1 → +5)
Success / failure mechanic
Resource consumption
Market Economy
Player driven item market
Buy / sell mechanics
Market listing system
Economy tick events
Boss System
Global Galaxy Boss
Player join system
Combat phase
Reward distribution
API Structure
Main API routes:
/player
/world
/worldmap
/galaxy
/equipment
/market
Example endpoints:
GET /health
GET /world
POST /player/create
GET /market
POST /equipment/equip
POST /equipment/refine
Test Coverage
The project contains automated tests validating the core engines and API.
Test Suites: 50 passed
Tests: 103 passed
Tests include:
player systems
combat mechanics
loot generation
equipment engine
refine system
market economy
world routes
Testing stack:
Jest
Supertest
Running the Project
Install dependencies
npm install
Run server
node src/server.js
Run automated tests
npm test
Development Environment
This entire project was developed on:
Termux (Android mobile environment)
Using:
Node.js
Express
Jest
Project Goal
This project was built as a backend engineering exercise focusing on:
modular architecture
server-side game simulation
economy systems
automated testing
Author
Renan Borges
Junior Backend Developer
GitHub
https://github.com/renanborges-dev⁠�
Email
borgesrenan263@gmail.com EOF
