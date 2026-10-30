export function computeLeadScore(lead, followupCount = 0) {
  let score = 0;
  const source = (lead.source_type || '').toLowerCase();
  
  // Source calculation
  if (source.includes('referral') || source.includes('client_referral')) {
    score += 20;
  } else if (source.includes('website') || source.includes('website_form') || source.includes('form')) {
    score += 10;
  } else if (source.includes('meta') || source.includes('google') || source.includes('tiktok') || source.includes('ad')) {
    score += 12;
  } else {
    score += 5;
  }

  // Budget Tier
  const budget = (lead.budget_tier || '').toLowerCase();
  if (budget.includes('enterprise') || budget.includes('high') || budget.includes('vip')) {
    score += 15;
  } else if (budget.includes('medium') || budget.includes('growth')) {
    score += 10;
  }

  // Followup & Engagement (+5 per logged call/followup)
  score += (followupCount * 5);

  // Stage bonus
  const stage = (lead.pipeline_stage || '').toLowerCase();
  if (stage === 'won') score += 50;
  else if (stage.includes('proposal') || stage.includes('meeting')) score += 25;
  else if (stage.includes('contacted') || stage.includes('qualified')) score += 10;

  return score;
}

export function getScoreBadge(score) {
  if (score >= 40) {
    return { label: '🔥 Hot', color: '#ef4444', tier: 'hot', score };
  } else if (score >= 20) {
    return { label: '🌡️ Warm', color: '#f59e0b', tier: 'warm', score };
  } else {
    return { label: '❄️ Cold', color: '#3b82f6', tier: 'cold', score };
  }
}
