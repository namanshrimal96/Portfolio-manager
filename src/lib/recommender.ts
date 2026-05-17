import { Card, EarnRate, Milestone, RecommendationResult } from "./types";

const STALE_DAYS = 90;

function daysSince(dateStr: string): number {
  return Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)
  );
}

export function computeRecommendations(
  amountInr: number,
  category: string,
  cards: Card[],
  earnRatesMap: Record<string, EarnRate[]>,
  milestonesMap: Record<string, Milestone[]>,
  cardYearSpendMap: Record<string, number>
): RecommendationResult[] {
  const results: RecommendationResult[] = [];

  for (const card of cards) {
    if (!card.active) continue;

    const rates = earnRatesMap[card.card_id] ?? [];

    // Check if category is explicitly excluded
    const exclusionRate = rates.find((r) => r.category === category && r.excluded);
    if (exclusionRate) {
      results.push({
        card_id: card.card_id,
        card_name: card.display_name,
        holder_id: card.holder_id,
        expected_value_inr: 0,
        return_rate: 0,
        base_value: 0,
        milestone_bonus: 0,
        fee_waiver_bonus: 0,
        points_earned: 0,
        currency_code: exclusionRate.currency_code,
        reasoning: [`"${category}" earns 0 — excluded category on this card`],
        is_excluded: true,
        exclusion_reason: `${category} excluded`,
      });
      continue;
    }

    // Exact category match, then fall back to general
    const rate =
      rates.find((r) => r.category === category && !r.excluded) ??
      rates.find((r) => r.category === "general" && !r.excluded);

    if (!rate) continue;

    const stale = daysSince(rate.last_verified) > STALE_DAYS;
    const cardYearSpend = cardYearSpendMap[card.card_id] ?? 0;
    const reasoning: string[] = [];

    // Base points — respect monthly cap
    let pointsEarned = 0;
    if (rate.monthly_cap_inr) {
      const remainingCap = Math.max(0, rate.monthly_cap_inr - cardYearSpend);
      if (amountInr <= remainingCap) {
        pointsEarned = (amountInr / 100) * rate.points_per_100_inr;
        reasoning.push(
          `${rate.points_per_100_inr} ${rate.currency_code}/₹100 (within ₹${(rate.monthly_cap_inr / 1000).toFixed(0)}K cap)`
        );
      } else {
        const atFull = remainingCap;
        const atCapped = amountInr - remainingCap;
        pointsEarned = (atFull / 100) * rate.points_per_100_inr;
        if (rate.capped_rate_per_100_inr) {
          pointsEarned += (atCapped / 100) * rate.capped_rate_per_100_inr;
          reasoning.push(
            `₹${atFull.toLocaleString("en-IN")} @ ${rate.points_per_100_inr}/₹100, ₹${atCapped.toLocaleString("en-IN")} @ ${rate.capped_rate_per_100_inr}/₹100 (post-cap)`
          );
        } else {
          reasoning.push(`Spend cap exceeded — no earn on ₹${atCapped.toLocaleString("en-IN")}`);
        }
      }
    } else {
      pointsEarned = (amountInr / 100) * rate.points_per_100_inr;
      reasoning.push(`${rate.points_per_100_inr} ${rate.currency_code}/₹100`);
    }

    const baseValue = pointsEarned * rate.effective_value_per_point;
    reasoning.push(
      `${Math.round(pointsEarned).toLocaleString("en-IN")} ${rate.currency_code} → ₹${Math.round(baseValue).toLocaleString("en-IN")}`
    );

    // Milestone bonus
    let milestoneBonus = 0;
    const milestones = milestonesMap[card.card_id] ?? [];
    for (const m of milestones) {
      if (m.achieved || !m.benefit_value_inr) continue;
      const newSpend = cardYearSpend + amountInr;
      if (newSpend >= m.threshold_inr && cardYearSpend < m.threshold_inr) {
        milestoneBonus += m.benefit_value_inr;
        reasoning.push(
          `Crosses ₹${(m.threshold_inr / 100000).toFixed(1)}L milestone → ${m.benefit_description} (+₹${m.benefit_value_inr.toLocaleString("en-IN")})`
        );
      }
    }

    // Fee waiver bonus
    let feeWaiverBonus = 0;
    if (card.fee_waiver_spend_inr && card.annual_fee_inr && !card.ltf) {
      const newSpend = cardYearSpend + amountInr;
      if (newSpend >= card.fee_waiver_spend_inr && cardYearSpend < card.fee_waiver_spend_inr) {
        feeWaiverBonus = card.annual_fee_inr;
        reasoning.push(
          `Crosses fee waiver threshold → saves ₹${card.annual_fee_inr.toLocaleString("en-IN")} annual fee`
        );
      }
    }

    const totalValue = baseValue + milestoneBonus + feeWaiverBonus;

    results.push({
      card_id: card.card_id,
      card_name: card.display_name,
      holder_id: card.holder_id,
      expected_value_inr: totalValue,
      return_rate: (totalValue / amountInr) * 100,
      base_value: baseValue,
      milestone_bonus: milestoneBonus,
      fee_waiver_bonus: feeWaiverBonus,
      points_earned: Math.round(pointsEarned),
      currency_code: rate.currency_code,
      reasoning,
      is_excluded: false,
      stale_rate_warning: stale,
    });
  }

  return results.sort((a, b) => {
    if (a.is_excluded !== b.is_excluded) return a.is_excluded ? 1 : -1;
    return b.expected_value_inr - a.expected_value_inr;
  });
}
