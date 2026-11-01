// tests/skill-router.test.js
import { describe, it, expect } from 'vitest';
import { getSkillForAction, getCombinedSkillContext, enhanceWithArena, loadSkill } from '../functions/lib/skill-router.js';

describe('Skill Router Unit Tests', () => {
  it('correctly maps outreach actions to cold-email and sales-enablement skills', () => {
    const skills = getSkillForAction('generate_outreach');
    expect(skills).toContain('cold-email');
    expect(skills).toContain('sales-enablement');
  });

  it('maps objection handling to sales-enablement', () => {
    const skills = getSkillForAction('handle_objection');
    expect(skills).toEqual(['sales-enablement']);
  });

  it('maps YouTube scripts to yt-script and yt-package', () => {
    const skills = getSkillForAction('youtube_script');
    expect(skills).toContain('yt-script');
    expect(skills).toContain('yt-package');
  });

  it('maps landing page and CRO requests accurately', () => {
    const skills = getSkillForAction('landing_page');
    expect(skills).toContain('cro');
    expect(skills).toContain('copywriting');
  });

  it('falls back to copywriting for unknown actions', () => {
    const skills = getSkillForAction('unknown_random_action');
    expect(skills).toEqual(['copywriting']);
  });

  it('assembles combined context prompt containing skill markers', () => {
    const { skillNames, contextPrompt } = getCombinedSkillContext('generate_outreach');
    expect(skillNames).toHaveLength(2);
    expect(typeof contextPrompt).toBe('string');
  });

  it('enhances prompt with Arena adversarial competition rubric', () => {
    const prompt = 'Generate 3 high converting headlines';
    const enhanced = enhanceWithArena(prompt, 'copywriting');
    expect(enhanced).toContain(prompt);
  });
});
