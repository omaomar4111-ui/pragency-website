// functions/lib/skill-router.js
// Central Skill Router: Dynamically routes, loads, and injects specialized marketing/sales/creative skills & Arena arbitration into AI workflows

import { SKILLS_BUNDLE } from './skills_bundle.js';

/**
 * Loads a skill's authoritative context from the bundled skills repository
 * @param {string} skillName 
 * @returns {string} Skill context markdown
 */
export function loadSkill(skillName) {
  if (!skillName) return '';
  const norm = skillName.trim().toLowerCase();
  return SKILLS_BUNDLE[norm] || '';
}

/**
 * Returns the recommended skills for a given action and optional industry
 * @param {string} actionType 
 * @param {string} [industry=''] 
 * @returns {string[]} Array of skill names
 */
export function getSkillForAction(actionType, industry = '') {
  const act = (actionType || '').trim().toLowerCase();
  
  switch (act) {
    case 'generate_outreach':
    case 'ai-outreach':
    case 'outreach':
      return ['cold-email', 'sales-enablement'];

    case 'handle_objection':
    case 'objection':
      return ['sales-enablement'];

    case 'create_brief':
    case 'ad_creative':
    case 'creative_brief':
      return ['ad-creative', 'copywriting'];

    case 'youtube_script':
    case 'yt_script':
    case 'video_script':
      return ['yt-script', 'yt-package'];

    case 'landing_page':
    case 'cro':
      return ['cro', 'copywriting'];

    case 'generate_presentation':
    case 'presentation':
    case 'proposal':
      return ['offers', 'pricing', 'sales-enablement', 'arena'];

    case 'content_pillars':
    case 'strategy_pillars':
    case 'write_strategy':
      return ['cro', 'copywriting', 'marketing-ideas'];

    case 'company_research':
    case 'research':
      return ['prospecting', 'arena'];

    default:
      return ['copywriting'];
  }
}

/**
 * Assembles combined context for an action to inject into the LLM system prompt
 * @param {string} actionType 
 * @param {string} [industry=''] 
 * @returns {{ skillNames: string[], contextPrompt: string }}
 */
export function getCombinedSkillContext(actionType, industry = '') {
  const skillNames = getSkillForAction(actionType, industry);
  let contextPrompt = '';

  for (const name of skillNames) {
    const content = loadSkill(name);
    if (content) {
      contextPrompt += `\n\n--- [AUTHORITATIVE AGENT SKILL: ${name.toUpperCase()}] ---\n${content}\n--- [END SKILL: ${name.toUpperCase()}] ---\n`;
    }
  }

  return {
    skillNames,
    contextPrompt
  };
}

/**
 * Wraps prompt in Arena Skill multi-perspective adversarial competition logic
 * @param {string} prompt 
 * @param {string} actionType 
 * @returns {string} Enhanced prompt for the LLM
 */
export function enhanceWithArena(prompt, actionType = '') {
  const arenaRubric = loadSkill('arena') || 'Score solutions across Correctness, Completeness, Robustness to Objections, Specificity, and Clarity.';
  
  return `[ARENA SKILL ACTIVE - TOURNAMENT EVALUATION ENGINE]
Task: "${prompt}"

Rules:
1. Simulate a tournament with 3 distinct competing agent perspectives:
   - Agent Alpha: Aggressive ROI & High-Conversion focus
   - Agent Beta: Premium Branding & Positioning focus
   - Agent Gamma: Operational Feasibility & Value-for-Money focus
2. Contrast and critique the 3 approaches on: ${arenaRubric.slice(0, 300)}
3. Declare the tournament winner and produce the single most robust, polished, and victorious final output.
`;
}
