-- Portfolio Manager — Supabase (PostgreSQL) Schema
-- Run this in the Supabase SQL Editor (dashboard → SQL Editor → New query)

-- Currencies reference table (floor values for portfolio valuation)
CREATE TABLE currencies (
  currency_code         TEXT PRIMARY KEY,
  display_name          TEXT NOT NULL,
  program               TEXT NOT NULL,
  floor_value_per_point REAL NOT NULL DEFAULT 0.25,
  notes                 TEXT
);

-- Holders
CREATE TABLE holders (
  holder_id      TEXT PRIMARY KEY,
  display_name   TEXT NOT NULL,
  notes          TEXT
);

-- Cards
CREATE TABLE cards (
  card_id              TEXT PRIMARY KEY,
  holder_id            TEXT NOT NULL REFERENCES holders(holder_id),
  display_name         TEXT NOT NULL,
  issuer               TEXT NOT NULL,
  network              TEXT,
  annual_fee_inr       INTEGER,
  fee_waiver_spend_inr INTEGER,
  anniversary_date     DATE,
  ltf                  BOOLEAN DEFAULT FALSE,
  active               BOOLEAN DEFAULT TRUE,
  notes                TEXT
);

-- Earn rates (one row per card × category)
CREATE TABLE earn_rates (
  rate_id                   SERIAL PRIMARY KEY,
  card_id                   TEXT NOT NULL REFERENCES cards(card_id),
  category                  TEXT NOT NULL,
  currency_code             TEXT NOT NULL REFERENCES currencies(currency_code),
  points_per_100_inr        REAL NOT NULL,
  monthly_cap_inr           INTEGER,
  capped_rate_per_100_inr   REAL,
  effective_value_per_point REAL NOT NULL,
  excluded                  BOOLEAN DEFAULT FALSE,
  last_verified             DATE NOT NULL,
  notes                     TEXT
);

-- Currency balances (time-series snapshots; query current_balances view for latest)
CREATE TABLE currency_balances (
  balance_id            SERIAL PRIMARY KEY,
  currency_code         TEXT NOT NULL REFERENCES currencies(currency_code),
  holder_id             TEXT NOT NULL REFERENCES holders(holder_id),
  balance               INTEGER NOT NULL,
  tier                  TEXT,
  tier_valid_until      DATE,
  oldest_tranche_expiry DATE,
  ytd_earned            INTEGER DEFAULT 0,
  ytd_redeemed          INTEGER DEFAULT 0,
  snapshot_date         DATE NOT NULL,
  notes                 TEXT
);

-- Transfer partners
CREATE TABLE transfer_partners (
  transfer_id          SERIAL PRIMARY KEY,
  source_currency      TEXT NOT NULL REFERENCES currencies(currency_code),
  target_currency      TEXT NOT NULL REFERENCES currencies(currency_code),
  ratio_source         INTEGER NOT NULL,
  ratio_target         INTEGER NOT NULL,
  group_tag            TEXT,
  annual_cap_total     INTEGER,
  annual_cap_group_a   INTEGER,
  annual_cap_group_b   INTEGER,
  per_transfer_fee_inr REAL,
  min_transfer_units   INTEGER,
  last_verified        DATE NOT NULL,
  active               BOOLEAN DEFAULT TRUE,
  notes                TEXT
);

-- Transfer log (each executed transfer)
CREATE TABLE transfer_log (
  log_id          SERIAL PRIMARY KEY,
  transfer_date   DATE NOT NULL,
  source_currency TEXT NOT NULL REFERENCES currencies(currency_code),
  target_currency TEXT NOT NULL REFERENCES currencies(currency_code),
  holder_id       TEXT NOT NULL REFERENCES holders(holder_id),
  source_amount   INTEGER NOT NULL,
  target_amount   INTEGER NOT NULL,
  fee_inr         REAL,
  group_tag       TEXT,
  notes           TEXT
);

-- Vouchers (defined before milestones; FK to milestones added after)
CREATE TABLE vouchers (
  voucher_id          SERIAL PRIMARY KEY,
  source_card_id      TEXT REFERENCES cards(card_id),
  source_milestone_id INTEGER,
  voucher_type        TEXT NOT NULL,
  description         TEXT,
  face_value_inr      INTEGER,
  effective_value_inr INTEGER,
  issued_date         DATE,
  expiry_date         DATE,
  redeemed            BOOLEAN DEFAULT FALSE,
  redeemed_date       DATE,
  redeemed_against    TEXT,
  notes               TEXT
);

-- Milestones
CREATE TABLE milestones (
  milestone_id      SERIAL PRIMARY KEY,
  card_id           TEXT NOT NULL REFERENCES cards(card_id),
  threshold_inr     INTEGER NOT NULL,
  benefit_description TEXT NOT NULL,
  benefit_value_inr INTEGER,
  benefit_type      TEXT,
  achieved          BOOLEAN DEFAULT FALSE,
  achieved_date     DATE,
  voucher_id        INTEGER REFERENCES vouchers(voucher_id),
  notes             TEXT
);

ALTER TABLE vouchers
  ADD CONSTRAINT fk_milestone
  FOREIGN KEY (source_milestone_id) REFERENCES milestones(milestone_id);

-- Spend log
CREATE TABLE spend_log (
  spend_id      SERIAL PRIMARY KEY,
  txn_date      DATE NOT NULL,
  card_id       TEXT NOT NULL REFERENCES cards(card_id),
  amount_inr    REAL NOT NULL,
  category      TEXT NOT NULL,
  merchant      TEXT,
  mcc           TEXT,
  points_earned INTEGER,
  notes         TEXT
);

-- Redemption log
CREATE TABLE redemption_log (
  redemption_id    SERIAL PRIMARY KEY,
  redemption_date  DATE NOT NULL,
  currency_code    TEXT NOT NULL REFERENCES currencies(currency_code),
  holder_id        TEXT NOT NULL REFERENCES holders(holder_id),
  points_used      INTEGER NOT NULL,
  redemption_type  TEXT NOT NULL,
  description      TEXT,
  cash_value_inr   REAL,
  points_value_inr REAL,
  notes            TEXT
);

-- View: latest balance snapshot per (currency, holder)
CREATE OR REPLACE VIEW current_balances AS
SELECT DISTINCT ON (currency_code, holder_id)
  balance_id, currency_code, holder_id, balance,
  tier, tier_valid_until, oldest_tranche_expiry,
  ytd_earned, ytd_redeemed, snapshot_date, notes
FROM currency_balances
ORDER BY currency_code, holder_id, snapshot_date DESC, balance_id DESC;

-- View: YTD transfers per source currency and group (resets Jan 1)
CREATE OR REPLACE VIEW ytd_transfer_usage AS
SELECT
  source_currency,
  group_tag,
  EXTRACT(YEAR FROM transfer_date)::INTEGER AS year,
  SUM(source_amount) AS total_transferred
FROM transfer_log
GROUP BY source_currency, group_tag, EXTRACT(YEAR FROM transfer_date);
