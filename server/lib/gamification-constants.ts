// This file holds the authoritative, hardcoded values for gamification rewards.
// The client should only send the action type, not the amount.

export const SERVER_EXP_ACTIONS = {
  CREATE_POST: 25,
  REMOVE_POST: -25,
  EARN_BADGE: 50,
  CREATE_COMMENT: 10, // Although not currently used by client, defining here for completeness
};

export const BADGE_REWARD_GEMS = 30;