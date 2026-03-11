# Dungeon SSS Trader

Backend architecture for an experimental MMORPG economy and world simulation.

This project simulates the core server systems of an online RPG including:

• Combat engine  
• Farm engine with dynamic spawn  
• Equipment and refine system (+1 to +5)  
• Player inventory  
• World sectors and movement  
• Global events  
• Galaxy boss system  
• Player driven market economy  
• Automated game loop  

The server exposes a REST API that controls the entire game world.

---

## Architecture

Player
↓
API (Express)
↓
Game Engine
- Combat Engine
- Loot System
- Farm Engine
- Equipment Engine
- Market Engine
- Galaxy Boss Engine
- World Loop Engine
↓
Game State

---

## Technologies

Node.js  
Express  
Jest  
Supertest  

Development environment:

Termux (Android mobile development)

---

## Test Coverage
The project contains automated tests validating:

- player systems
- equipment systems
- combat mechanics
- loot generation
- reward engine
- market system
- world routes

---

## Running the project

Install dependencies:
Test Suites: 50 passed Tests: 103 passed
Start the server:
Run automated tests:
---

## Project Goal

This project was built as a backend engineering study focusing on:

game architecture  
server-side simulation  
modular engine design  
automated testing

---

## Author

Renan Borges  
Junior Backend Developer

GitHub  
https://github.com/renanborges-dev

Email  
borgesrenan263@gmail.com

