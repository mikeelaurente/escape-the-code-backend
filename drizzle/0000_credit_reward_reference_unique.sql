ALTER TABLE credit_transactions
ADD COLUMN reward_event_key VARCHAR(191) NULL;

ALTER TABLE credit_transactions
ADD COLUMN reward_idempotency_key VARCHAR(191)
GENERATED ALWAYS AS (
  CASE
    WHEN `group` = 'reward' AND `type` = 'in' THEN reward_event_key
    ELSE NULL
  END
) STORED;

ALTER TABLE credit_transactions
ADD CONSTRAINT credit_reward_reference_unique
UNIQUE (user_id, reward_idempotency_key);
