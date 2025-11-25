import type * as schema from '../db/schema';

export type Challenge = typeof schema.challenges.$inferSelect;
export type ChallengeId = Challenge['id'];
