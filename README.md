# Dungeon SSS Trader

Backend architecture for a simulated MMORPG economy and world engine.

This project implements the core server-side systems of an online RPG including combat, loot, equipment, refine mechanics, world simulation and a player-driven market.

The goal of the project is to study **backend architecture, modular game engines and automated testing**.

---

# Architecture Overview

Player
↓
REST API (Express)
↓
Game Engine
│
├ Combat Engine
├ Loot System
├ Farm Engine
├ Equipment Engine
├ Refine System
├ Market Economy
├ Galaxy Boss System
└ World Simulation Loop
↓
Game State

---

# Game Systems Implemented

World Simulation

• Continuous world tick  
• Dynamic mob spawn  
• Global events  
• Sector based map

Combat System

• Auto combat loop  
• Damage calculation  
• Potion auto-heal  
• Enemy spawn logic

Equipment System

• Weapons and armor  
• Equip / unequip mechanics  
• Player stat calculation

Refine System

• Equipment upgrade system (+1 → +5)
• Success / failure mechanic
• Resource consumption

Market Economy

• Player driven item market
• Buy / sell mechanics
• Market listing system
• Economy tick events

Boss System

• Global Galaxy Boss
• Player join system
• Combat phase
• Reward distribution

---

# API Structure

Main API routes:

/player
/world
/worldmap
/galaxy
/equipment
/market

Example endpoints

GET /health

GET /world

POST /player/create

GET /market

POST /equipment/equip

POST /equipment/refine

---

# Test Coverage

The project contains automated tests validating the core engines and API.
Test Suites: 50 passed Tests: 103 passed
Tests include:

• player systems  
• combat mechanics  
• loot generation  
• equipment engine  
• refine system  
• market economy  
• world routes  

Testing stack:

Jest  
Supertest

---

# Running the Project

Install dependencies
Run server
Run automated tests
---

# Development Environment

This entire project was developed on:

Termux (Android mobile environment)

Using:

Node.js  
Express  
Jest  

---

# Project Goal

This project was built as a backend engineering exercise focusing on:

• modular architecture  
• server-side game simulation  
• economy systems  
• automated testing  

---

# Author

Renan Borges  
Junior Backend Developer

GitHub  
https://github.com/renanborges-dev

Email  
borgesrenan263@gmail.com

