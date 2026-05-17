export interface Currency {
  currency_code: string;
  display_name: string;
  program: string;
  floor_value_per_point: number;
  notes?: string;
}

export interface Holder {
  holder_id: string;
  display_name: string;
  notes?: string;
}

export interface Card {
  card_id: string;
  holder_id: string;
  display_name: string;
  issuer: string;
  network?: string;
  annual_fee_inr?: number;
  fee_waiver_spend_inr?: number;
  anniversary_date?: string;
  ltf: boolean;
  active: boolean;
  notes?: string;
}

export interface EarnRate {
  rate_id: number;
  card_id: string;
  category: string;
  currency_code: string;
  points_per_100_inr: number;
  monthly_cap_inr?: number;
  capped_rate_per_100_inr?: number;
  effective_value_per_point: number;
  excluded: boolean;
  last_verified: string;
  notes?: string;
}

export interface CurrencyBalance {
  balance_id: number;
  currency_code: string;
  holder_id: string;
  balance: number;
  tier?: string;
  tier_valid_until?: string;
  oldest_tranche_expiry?: string;
  ytd_earned: number;
  ytd_redeemed: number;
  snapshot_date: string;
  notes?: string;
}

export interface TransferPartner {
  transfer_id: number;
  source_currency: string;
  target_currency: string;
  ratio_source: number;
  ratio_target: number;
  group_tag?: string;
  annual_cap_total?: number;
  annual_cap_group_a?: number;
  annual_cap_group_b?: number;
  per_transfer_fee_inr?: number;
  min_transfer_units?: number;
  last_verified: string;
  active: boolean;
  notes?: string;
}

export interface TransferLog {
  log_id: number;
  transfer_date: string;
  source_currency: string;
  target_currency: string;
  holder_id: string;
  source_amount: number;
  target_amount: number;
  fee_inr?: number;
  group_tag?: string;
  notes?: string;
}

export interface Milestone {
  milestone_id: number;
  card_id: string;
  threshold_inr: number;
  benefit_description: string;
  benefit_value_inr?: number;
  benefit_type?: string;
  achieved: boolean;
  achieved_date?: string;
  voucher_id?: number;
  notes?: string;
}

export interface Voucher {
  voucher_id: number;
  source_card_id?: string;
  source_milestone_id?: number;
  voucher_type: string;
  description?: string;
  face_value_inr?: number;
  effective_value_inr?: number;
  issued_date?: string;
  expiry_date?: string;
  redeemed: boolean;
  redeemed_date?: string;
  redeemed_against?: string;
  notes?: string;
}

export interface SpendLog {
  spend_id: number;
  txn_date: string;
  card_id: string;
  amount_inr: number;
  category: string;
  merchant?: string;
  mcc?: string;
  points_earned?: number;
  notes?: string;
}

export interface RecommendationResult {
  card_id: string;
  card_name: string;
  holder_id: string;
  expected_value_inr: number;
  return_rate: number;
  base_value: number;
  milestone_bonus: number;
  fee_waiver_bonus: number;
  points_earned: number;
  currency_code: string;
  reasoning: string[];
  is_excluded: boolean;
  exclusion_reason?: string;
  stale_rate_warning?: boolean;
}

export const CATEGORIES = [
  "general",
  "dining",
  "fuel",
  "grocery",
  "travel_direct",
  "travel_portal_smartbuy",
  "travel_portal_axis",
  "travel_portal_amex",
  "utility",
  "insurance",
  "rent",
  "government",
  "education",
  "wallet",
  "international",
  "online_shopping",
] as const;

export type Category = (typeof CATEGORIES)[number];
