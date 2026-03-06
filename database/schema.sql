CREATE TABLE players (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nickname TEXT UNIQUE,
  class TEXT,
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE currencies (
  player_id INTEGER,
  gold INTEGER DEFAULT 0,
  obsidian REAL DEFAULT 0,
  usdt REAL DEFAULT 0,
  FOREIGN KEY(player_id) REFERENCES players(id)
);

CREATE TABLE items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  rarity TEXT,
  base_attack INTEGER,
  base_defense INTEGER
);

CREATE TABLE inventory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id INTEGER,
  item_id INTEGER,
  upgrade_level INTEGER DEFAULT 0,
  FOREIGN KEY(player_id) REFERENCES players(id),
  FOREIGN KEY(item_id) REFERENCES items(id)
);

CREATE TABLE sectors (
  id INTEGER PRIMARY KEY,
  name TEXT,
  min_level INTEGER,
  max_level INTEGER,
  school_owner TEXT
);

CREATE TABLE monsters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  sector_id INTEGER,
  hp INTEGER,
  attack INTEGER
);

CREATE TABLE drops (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  monster_id INTEGER,
  crystal_rank TEXT,
  gold_value INTEGER,
  drop_rate REAL
);

CREATE TABLE forge_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id INTEGER,
  item_id INTEGER,
  attempt_level INTEGER,
  success INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ranking (
  player_id INTEGER,
  power_score INTEGER
);

CREATE TABLE boss_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  boss_name TEXT,
  sector INTEGER,
  status TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE marketplace (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  seller_id INTEGER,
  item_id INTEGER,
  price_usdt REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
