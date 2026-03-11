# Dungeon SSS Trader

MMORPG backend simulation engine built with Node.js and Express.

This project simulates the backend architecture of an online RPG world including real-time events, multiplayer interactions, analytics, telemetry, persistence, and a live dashboard.

The system was developed entirely from a **mobile development environment using Termux**.

---

# Overview

Dungeon SSS Trader is a backend platform that simulates the core systems of a multiplayer RPG server.

The backend includes:

- World simulation engine
- Dynamic economy system
- Loot and reward engines
- PvP combat system
- Inventory and equipment systems
- Marketplace trading
- Multiplayer realtime engine
- WebSocket event streaming
- Analytics and telemetry
- SQLite persistence
- Live monitoring dashboard

---

# Architecture

The project follows a modular backend architecture.

Dungeon SSS Trader

API Layer
- player
- inventory
- market
- pvp
- multiplayer
- persistence

Game Engines
- world loop engine
- economy engine
- loot system
- reward system

Realtime
- websocket hub
- event broadcast

Multiplayer
- join player
- move player
- attack player
- leave player

Observability
- analytics engine
- telemetry engine

Database
- SQLite persistence layer

Interface
- live monitoring dashboard

---

# World Simulation Engine

The world engine continuously simulates the game environment.

It generates:

- world ticks
- mob spawns
- global events
- galaxy boss spawns
- economy updates

Example simulated world state:

Tick: 9  
Mobs Spawned: 6  
Global Events: 2  

The world engine runs automatically once the server starts.

---

# Economy Engine

The economy system simulates supply and demand across the game world.

Items include:

iron_sword  
leather_armor  
apprentice_ring  
refine_stone  
mana_crystal  
mana_crystal_f  

Prices fluctuate dynamically based on simulated trades.

Example economy output:

iron_sword: 100  
leather_armor: 80  
apprentice_ring: 77  
refine_stone: 120  

---

# Multiplayer Engine

Players can interact with the world through API endpoints.

Supported actions:

join world  
move player  
attack player  
leave world  

Multiplayer events are broadcast through WebSocket.

Example realtime events:

player:join  
player:move  
player:attack  
player:leave  

---

# Realtime Event Streaming

The system uses WebSocket to stream live game events.

Clients receive updates for:

world updates  
mob spawns  
economy ticks  
boss events  
multiplayer activity  

Example message structure:

type: world:update  
payload:
- ticks
- mobsSpawned

---

# Analytics System

The analytics engine tracks simulation metrics such as:

spawn rate  
event rate  
market activity  
online players  

Example metrics:

Spawn Rate: 0.58  
Event Rate: 0.17  
Market Listings: 0  
Online Players: 0  

These metrics help observe system behavior.

---

# Telemetry System

Telemetry monitors the health and behavior of the server.

Tracked metrics include:

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

Game data is stored using SQLite.

Persisted data includes:

players  
world state  
market state  

Persistence endpoints:

POST /persistence/init  
POST /persistence/save  
GET  /persistence/load  

This allows the simulated world state to be stored and restored.

---

# API Overview

Main API routes:

/player  
/inventory  
/market  
/pvp  
/multiplayer  
/persistence  
/analytics  
/telemetry  
/dashboard  

Example player creation request:

POST /player/create  

Body:

name: HeroAPI

---

# Live Dashboard

The project includes a live dashboard that displays:

world state  
galaxy boss  
economy prices  
leaderboards  
analytics metrics  
telemetry metrics  

The dashboard automatically refreshes every few seconds.

---

# Automated Testing

The project includes a full automated test suite.

Test Suites: 58  
Tests: 120  
Status: All passing  

Testing stack:

Jest  
Supertest  

Tests validate:

world engine  
loot system  
reward system  
economy engine  
inventory system  
player state  
multiplayer engine  
persistence layer  
API routes  

---

# Tech Stack

Backend technologies used in this project:

Node.js  
Express  
WebSocket (ws)  
SQLite  
Jest  
Supertest  

---

# Development Environment

This entire project was developed using a **mobile coding environment**.

Tools used:

Termux  
Node.js  
Git  
Vite (dashboard development)

---

# How To Run

Clone repository:

git clone <repository-url>  
cd dungeon-sss-trader  

Install dependencies:

npm install  

Start server:

node src/server.js  

Run tests:

npm test  

Open dashboard:

http://127.0.0.1:3000/dashboard

---

# Project Goal

The goal of this project is to demonstrate backend engineering skills in:

real-time systems  
simulation engines  
game economy systems  
multiplayer architecture  
observability and telemetry  
automated testing  

---

# Author

Renan Borges

Backend developer focused on:

Node.js  
API architecture  
Realtime systems  
Game simulation engines  

Developed as a portfolio project to demonstrate backend engineering skills.
