# Dungeon SSS Trader

MMORPG backend simulation platform built with Node.js and Express.

This project simulates the backend infrastructure of a persistent online RPG world including:

- realtime world simulation
- dynamic economy system
- loot and reward engines
- PvP combat
- multiplayer architecture
- WebSocket realtime events
- analytics and telemetry
- SQLite persistence
- live dashboard monitoring

The entire system was developed from a **mobile development environment using Termux**.

---

# System Vision

Dungeon SSS Trader simulates a live multiplayer RPG server where a persistent world evolves through automated engines.

The backend continuously simulates:

- world ticks
- monster spawning
- item economy
- boss events
- player interactions
- multiplayer combat
- analytics metrics
- telemetry monitoring

The goal of the project is to demonstrate backend architecture used in:

- multiplayer games
- realtime systems
- simulation engines
- distributed event systems
- API based architectures

---

# High Level Architecture

Dungeon SSS Trader

API Layer
- Player API
- Inventory API
- Market API
- PvP API
- Multiplayer API
- Persistence API

Game Engines
- World Engine
- Spawn Engine
- Loot Engine
- Reward Engine
- Economy Engine
- Combat Engine

Realtime Systems
- WebSocket Hub
- Event Broadcast System
- Multiplayer Event Streaming

Observability
- Analytics Engine
- Telemetry Engine

Persistence
- SQLite Storage Layer

Interface
- Live Monitoring Dashboard

---

# Engine Architecture

The system runs several autonomous engines responsible for simulating the world.

World Engine

Responsible for generating world ticks and controlling global simulation.

Responsibilities:

- generate world ticks
- trigger spawn cycles
- schedule events
- control boss spawns
- update economy

Example world state:

Tick: 9  
Mobs Spawned: 6  
Global Events: 2  

---

Spawn Engine

Controls monster spawning across the world.

Features:

- dynamic spawn rate
- difficulty scaling
- zone based spawn logic

---

Loot Engine

Determines items dropped by monsters.

Features:

- rarity system
- item pools
- weighted drops

Example drop table:

iron_sword  
leather_armor  
mana_crystal  
refine_stone  

---

Reward Engine

Calculates rewards for defeating monsters.

Rewards include:

- experience
- gold
- item drops

---

Combat Engine

Handles combat mechanics including:

- player vs monster
- player vs player
- critical hits
- damage calculation

---

Economy Engine

Simulates the global item economy.

Features:

- supply and demand simulation
- market pricing
- trading system

Example economy state:

iron_sword: 100  
leather_armor: 80  
apprentice_ring: 77  
refine_stone: 120  
mana_crystal: 164  

---

# Multiplayer Architecture

The multiplayer system allows players to interact in realtime.

Supported actions:

join world  
move player  
attack player  
leave world  

Events are broadcast through the realtime event system.

Example multiplayer events:

player:join  
player:move  
player:attack  
player:leave  

---

# Realtime Event System

The system includes a WebSocket hub that broadcasts live events.

Clients receive updates for:

- world ticks
- mob spawns
- economy changes
- boss events
- multiplayer activity

Example event message:

type: world:update

payload:
- ticks
- mobsSpawned

---

# Galaxy Boss System

The world includes a global boss entity.

Example boss state:

Name: Galaxy Sovereign  
HP: 5000 / 5000  
Alive: YES  

Boss encounters generate global events visible to all players.

---

# Analytics System

The analytics engine measures system behavior and simulation metrics.

Tracked metrics include:

spawn rate  
event rate  
market listings  
online players  

Example analytics:

Spawn Rate: 0.58  
Event Rate: 0.17  
Market Listings: 0  
Online Players: 0  

---

# Telemetry System

Telemetry tracks the health of the server.

Metrics include:

uptime  
ticks per second  
economy ticks  
boss spawns  
mob spawns  
global events  

Example telemetry output:

Uptime: 24s  
TPS: 0.5  
Economy Ticks: 2  
Boss Spawns: 0  
Global Events: 2  
Mob Spawns: 7  

---

# Persistence Layer

The project uses SQLite for data persistence.

Persisted entities include:

players  
world state  
market state  

Persistence endpoints:

POST /persistence/init  
POST /persistence/save  
GET /persistence/load  

This allows the simulated world state to be restored.

---

# API Overview

Main routes:

/player  
/inventory  
/market  
/pvp  
/multiplayer  
/persistence  
/analytics  
/telemetry  
/dashboard  

Example player creation:

POST /player/create

Body:

name: HeroAPI

---

# Dashboard

A live dashboard provides visibility into the system.

Displays:

world state  
galaxy boss status  
economy prices  
leaderboards  
analytics metrics  
telemetry metrics  

The dashboard automatically refreshes periodically.

Access:

http://127.0.0.1:3000/dashboard

---

# Testing

The project includes a comprehensive automated test suite.

Test Suites: 58  
Tests: 120  
All tests passing.

Testing tools:

Jest  
Supertest  

Tests validate:

world simulation  
loot system  
reward system  
economy engine  
inventory system  
player state  
multiplayer actions  
persistence layer  
API endpoints  

---

# Technology Stack

Backend:

Node.js  
Express  

Realtime:

WebSocket (ws)

Database:

SQLite

Testing:

Jest  
Supertest

Development:

Termux  
Git  
Vite (dashboard)

---

# Development Environment

This project was developed entirely from a mobile development environment using Termux.

Tools used:

Termux  
Node.js  
Git  
Vite

This demonstrates that complex backend systems can be built even in constrained environments.

---

# Running The Project

Clone repository:

git clone <repository-url>

Enter project folder:

cd dungeon-sss-trader

Install dependencies:

npm install

Start server:

node src/server.js

Run automated tests:

npm test

Open dashboard:

http://127.0.0.1:3000/dashboard

---

# Project Goal

The objective of this project is to demonstrate backend engineering skills including:

real-time systems  
simulation engines  
multiplayer architectures  
event driven systems  
observability and monitoring  
automated testing  

---

# Author

Renan Borges

Backend developer focused on:

Node.js  
API architecture  
Realtime systems  
Game simulation engines  

This project was created as a portfolio demonstration of backend engineering capabilities.
