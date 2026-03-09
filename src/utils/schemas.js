const { z } = require("zod");

const positiveInt = z.number().int().positive();

const gainXpSchema = z.object({
  playerId: positiveInt,
  xpAmount: z.number().int().positive()
});

const learnSkillSchema = z.object({
  playerId: positiveInt,
  skillId: positiveInt
});

const dungeonProgressSchema = z.object({
  playerId: positiveInt
});

const arenaAttackSchema = z.object({
  attackerPlayerId: positiveInt
});

const guildDepositGoldSchema = z.object({
  guildId: positiveInt,
  playerId: positiveInt,
  goldAmount: z.number().int().positive()
});

module.exports = {
  gainXpSchema,
  learnSkillSchema,
  dungeonProgressSchema,
  arenaAttackSchema,
  guildDepositGoldSchema
};
