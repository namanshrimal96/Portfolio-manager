-- Seed data — run AFTER schema.sql
-- Update anniversary_date, balances, and vouchers with your real data

-- Currencies
INSERT INTO currencies (currency_code, display_name, program, floor_value_per_point, notes) VALUES
  ('HDFC_RP',          'HDFC Reward Points',       'HDFC SmartBuy',         1.00, '₹1/pt on SmartBuy flights/hotels. Floor value.'),
  ('AXIS_EDGE_REWARD', 'Axis EDGE Rewards',          'Axis EDGE',             0.75, '~₹0.75 via 5:4 to Maharaja. Floor if no transfer planned: ₹0.25.'),
  ('AXIS_EDGE_MILES',  'Axis EDGE Miles',            'Axis EDGE (Atlas)',     0.75, 'Atlas-specific earn currency.'),
  ('AMEX_MR',          'Amex Membership Rewards',   'Amex India',            0.50, 'Verify current transfer partners — list changes frequently.'),
  ('MAHARAJA',         'Air India Maharaja Points', 'Air India Flying Returns', 0.85, 'Floor ~₹0.85/pt economy domestic. BOM-US one-way = 40K pts from Apr 2026.'),
  ('MARRIOTT',         'Marriott Bonvoy Points',    'Marriott Bonvoy',       0.40, 'Rough INR floor. Cat 1 props better.'),
  ('BA_AVIOS',         'British Airways Avios',     'British Airways Exec Club', 0.50, 'Added as Axis partner Apr 2026 at 5:2. Value varies heavily by route.');

-- Holders
INSERT INTO holders (holder_id, display_name) VALUES
  ('self',   'Self'),
  ('spouse', 'Spouse');

-- Cards (self)
INSERT INTO cards (card_id, holder_id, display_name, issuer, network, annual_fee_inr, fee_waiver_spend_inr, active, notes) VALUES
  ('hdfc_infinia',         'self', 'HDFC Infinia',        'HDFC', 'Visa',       12500, 1000000, TRUE, 'Update anniversary_date'),
  ('axis_magnus_burgundy', 'self', 'Axis Magnus Burgundy','Axis', 'Mastercard', 10000, NULL,    TRUE, 'Update anniversary_date'),
  ('axis_atlas',           'self', 'Axis Atlas',          'Axis', 'Visa',        5000, NULL,    TRUE, 'Update anniversary_date');

-- Cards (spouse)
INSERT INTO cards (card_id, holder_id, display_name, issuer, network, annual_fee_inr, fee_waiver_spend_inr, active, notes) VALUES
  ('amex_mrcc',            'spouse', 'Amex MRCC',               'Amex', 'Amex',       4500,  NULL, TRUE, 'Update anniversary_date'),
  ('axis_magnus_spouse',   'spouse', 'Axis Magnus (Spouse)',     'Axis', 'Mastercard', 10000, NULL, TRUE, 'Update anniversary_date');

-- Earn rates: HDFC Infinia
INSERT INTO earn_rates (card_id, category, currency_code, points_per_100_inr, effective_value_per_point, last_verified, notes) VALUES
  ('hdfc_infinia', 'general',       'HDFC_RP', 3.33, 1.00, '2026-05-17', '5 RP per ₹150'),
  ('hdfc_infinia', 'dining',        'HDFC_RP', 3.33, 1.00, '2026-05-17', NULL),
  ('hdfc_infinia', 'international', 'HDFC_RP', 3.33, 1.00, '2026-05-17', NULL);

INSERT INTO earn_rates (card_id, category, currency_code, points_per_100_inr, monthly_cap_inr, capped_rate_per_100_inr, effective_value_per_point, last_verified, notes) VALUES
  ('hdfc_infinia', 'travel_portal_smartbuy', 'HDFC_RP', 33.33, 1500000, 3.33, 1.00, '2026-05-17', '10x on SmartBuy flights/hotels. Verify current cap before booking.');

INSERT INTO earn_rates (card_id, category, currency_code, points_per_100_inr, effective_value_per_point, excluded, last_verified) VALUES
  ('hdfc_infinia', 'rent',       'HDFC_RP', 0, 1.00, TRUE, '2026-05-17'),
  ('hdfc_infinia', 'wallet',     'HDFC_RP', 0, 1.00, TRUE, '2026-05-17'),
  ('hdfc_infinia', 'fuel',       'HDFC_RP', 0, 1.00, TRUE, '2026-05-17'),
  ('hdfc_infinia', 'government', 'HDFC_RP', 0, 1.00, TRUE, '2026-05-17'),
  ('hdfc_infinia', 'insurance',  'HDFC_RP', 0, 1.00, TRUE, '2026-05-17');

-- Earn rates: Axis Magnus Burgundy (12 EDGE per ₹200 = 6 per ₹100)
INSERT INTO earn_rates (card_id, category, currency_code, points_per_100_inr, monthly_cap_inr, capped_rate_per_100_inr, effective_value_per_point, last_verified, notes) VALUES
  ('axis_magnus_burgundy', 'general',       'AXIS_EDGE_REWARD', 6, 150000, 3.33, 0.75, '2026-05-17', '12 EDGE per ₹200. Cap ₹1.5L/month; 3.33 above cap.'),
  ('axis_magnus_burgundy', 'dining',        'AXIS_EDGE_REWARD', 6, 150000, 3.33, 0.75, '2026-05-17', NULL),
  ('axis_magnus_burgundy', 'international', 'AXIS_EDGE_REWARD', 6, NULL,   NULL, 0.75, '2026-05-17', 'Verify — may have separate cap');

INSERT INTO earn_rates (card_id, category, currency_code, points_per_100_inr, effective_value_per_point, excluded, last_verified) VALUES
  ('axis_magnus_burgundy', 'fuel',       'AXIS_EDGE_REWARD', 0, 0.75, TRUE, '2026-05-17'),
  ('axis_magnus_burgundy', 'wallet',     'AXIS_EDGE_REWARD', 0, 0.75, TRUE, '2026-05-17'),
  ('axis_magnus_burgundy', 'rent',       'AXIS_EDGE_REWARD', 0, 0.75, TRUE, '2026-05-17'),
  ('axis_magnus_burgundy', 'government', 'AXIS_EDGE_REWARD', 0, 0.75, TRUE, '2026-05-17');

-- Earn rates: Axis Atlas (2 EDGE Miles per ₹100)
INSERT INTO earn_rates (card_id, category, currency_code, points_per_100_inr, effective_value_per_point, last_verified, notes) VALUES
  ('axis_atlas', 'general',       'AXIS_EDGE_MILES', 2, 0.75, '2026-05-17', 'Base rate. Verify accelerated travel categories.'),
  ('axis_atlas', 'international', 'AXIS_EDGE_MILES', 4, 0.75, '2026-05-17', 'Assumed 2x international — verify');

INSERT INTO earn_rates (card_id, category, currency_code, points_per_100_inr, effective_value_per_point, excluded, last_verified) VALUES
  ('axis_atlas', 'fuel',   'AXIS_EDGE_MILES', 0, 0.75, TRUE, '2026-05-17'),
  ('axis_atlas', 'wallet', 'AXIS_EDGE_MILES', 0, 0.75, TRUE, '2026-05-17');

-- Earn rates: Amex MRCC
INSERT INTO earn_rates (card_id, category, currency_code, points_per_100_inr, effective_value_per_point, last_verified, notes) VALUES
  ('amex_mrcc', 'general', 'AMEX_MR', 1, 0.50, '2026-05-17', '1 MR per ₹50 = 2 per ₹100. Verify current rate.'),
  ('amex_mrcc', 'dining',  'AMEX_MR', 5, 0.50, '2026-05-17', '5x on dining — verify');

-- Earn rates: Axis Magnus (Spouse) — same as self
INSERT INTO earn_rates (card_id, category, currency_code, points_per_100_inr, monthly_cap_inr, capped_rate_per_100_inr, effective_value_per_point, last_verified) VALUES
  ('axis_magnus_spouse', 'general', 'AXIS_EDGE_REWARD', 6, 150000, 3.33, 0.75, '2026-05-17');

INSERT INTO earn_rates (card_id, category, currency_code, points_per_100_inr, effective_value_per_point, excluded, last_verified) VALUES
  ('axis_magnus_spouse', 'fuel',   'AXIS_EDGE_REWARD', 0, 0.75, TRUE, '2026-05-17'),
  ('axis_magnus_spouse', 'wallet', 'AXIS_EDGE_REWARD', 0, 0.75, TRUE, '2026-05-17');

-- Milestones
INSERT INTO milestones (card_id, threshold_inr, benefit_description, benefit_value_inr, benefit_type) VALUES
  ('hdfc_infinia',         800000,  'Club Marriott annual membership',            12000, 'voucher'),
  ('hdfc_infinia',         1000000, 'Annual fee waiver',                          12500, 'other'),
  ('axis_magnus_burgundy', 1500000, 'Travel voucher or free night (verify)',       10000, 'voucher'),
  ('axis_magnus_burgundy', 750000,  'Domestic lounge access top-up (verify)',       5000, 'lounge');

-- Transfer partners (verified May 2026)
INSERT INTO transfer_partners (source_currency, target_currency, ratio_source, ratio_target, group_tag, annual_cap_total, annual_cap_group_a, annual_cap_group_b, per_transfer_fee_inr, min_transfer_units, last_verified, notes) VALUES
  ('AXIS_EDGE_REWARD', 'MAHARAJA', 5, 4, 'B', 1000000, 200000, 800000, 235, 300, '2026-05-17', 'Calendar-year cap. AI 50% bonus promos generally exclude Axis.'),
  ('AXIS_EDGE_REWARD', 'BA_AVIOS', 5, 2, 'A', 1000000, 200000, NULL,   235, 300, '2026-05-17', 'Added Apr 2026 along with Vietnam Airlines & Finnair at 5:2.'),
  ('HDFC_RP',          'MAHARAJA', 1, 1, NULL, NULL,    NULL,   NULL,   0,   1000,'2026-05-17', 'Verify current HDFC-Air India partnership status.');

-- Sample balances — UPDATE THESE WITH YOUR REAL NUMBERS
-- (run scripts/snapshot_balance to add new snapshots; this is just a starting point)
INSERT INTO currency_balances (currency_code, holder_id, balance, oldest_tranche_expiry, snapshot_date, notes) VALUES
  ('HDFC_RP',          'self',   0,       NULL,         '2026-05-17', 'Update with real balance from HDFC NetBanking'),
  ('AXIS_EDGE_REWARD', 'self',   0,       NULL,         '2026-05-17', 'Update from Axis app — check oldest tranche expiry in statement'),
  ('AXIS_EDGE_MILES',  'self',   0,       NULL,         '2026-05-17', 'Update from Axis app'),
  ('MAHARAJA',         'self',   0,       NULL,         '2026-05-17', 'Update from Air India Flying Returns portal'),
  ('AMEX_MR',          'spouse', 0,       NULL,         '2026-05-17', 'Update from Amex app'),
  ('AXIS_EDGE_REWARD', 'spouse', 0,       NULL,         '2026-05-17', 'Update from Axis app');
