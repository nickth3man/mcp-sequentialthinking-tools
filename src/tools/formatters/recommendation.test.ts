import { describe, it, expect } from 'vitest';
import { formatRecommendation } from './recommendation.js';
import type { StepRecommendation } from '../sequentialthinking/types.js';

describe('formatRecommendation', () => {
	it('should format a basic step with one tool', () => {
		const step: StepRecommendation = {
			step_description: 'Search documentation',
			expected_outcome: 'Find relevant docs',
			recommended_tools: [
				{
					tool_name: 'search_docs',
					confidence: 0.9,
					rationale: 'Find official docs',
					priority: 1,
				},
			],
		};

		const result = formatRecommendation(step);

		expect(result).toContain('Step: Search documentation');
		expect(result).toContain('Recommended Tools:');
		expect(result).toContain('  - search_docs (priority: 1)');
		expect(result).toContain('Rationale: Find official docs');
		expect(result).toContain('Expected Outcome: Find relevant docs');
	});

	it('should format multiple recommended tools', () => {
		const step: StepRecommendation = {
			step_description: 'Research step',
			expected_outcome: 'Gathered info',
			recommended_tools: [
				{
					tool_name: 'search_docs',
					confidence: 0.9,
					rationale: 'Search docs',
					priority: 1,
				},
				{
					tool_name: 'tavily_search',
					confidence: 0.8,
					rationale: 'Web search',
					priority: 2,
				},
			],
		};

		const result = formatRecommendation(step);

		expect(result).toContain('  - search_docs (priority: 1)');
		expect(result).toContain('Rationale: Search docs');
		expect(result).toContain('  - tavily_search (priority: 2)');
		expect(result).toContain('Rationale: Web search');
	});

	it('should include alternatives when present', () => {
		const step: StepRecommendation = {
			step_description: 'Search step',
			expected_outcome: 'Results found',
			recommended_tools: [
				{
					tool_name: 'search_docs',
					confidence: 0.9,
					rationale: 'Primary search',
					priority: 1,
					alternatives: ['google_search', 'bing_search'],
				},
			],
		};

		const result = formatRecommendation(step);

		expect(result).toContain('(alternatives: google_search, bing_search)');
	});

	it('should not include alternatives section when alternatives is empty', () => {
		const step: StepRecommendation = {
			step_description: 'Search step',
			expected_outcome: 'Results found',
			recommended_tools: [
				{
					tool_name: 'search_docs',
					confidence: 0.9,
					rationale: 'Primary search',
					priority: 1,
					alternatives: [],
				},
			],
		};

		const result = formatRecommendation(step);

		expect(result).not.toContain('alternatives');
	});

	it('should include suggested inputs when present', () => {
		const step: StepRecommendation = {
			step_description: 'Query step',
			expected_outcome: 'Data retrieved',
			recommended_tools: [
				{
					tool_name: 'db_query',
					confidence: 0.95,
					rationale: 'Query database',
					priority: 1,
					suggested_inputs: { query: 'SELECT * FROM users', limit: 10 },
				},
			],
		};

		const result = formatRecommendation(step);

		expect(result).toContain('Suggested inputs:');
		expect(result).toContain(JSON.stringify({ query: 'SELECT * FROM users', limit: 10 }));
	});

	it('should not include suggested inputs section when not present', () => {
		const step: StepRecommendation = {
			step_description: 'Simple step',
			expected_outcome: 'Done',
			recommended_tools: [
				{
					tool_name: 'tool1',
					confidence: 0.8,
					rationale: 'Do the thing',
					priority: 1,
				},
			],
		};

		const result = formatRecommendation(step);

		expect(result).not.toContain('Suggested inputs');
	});

	it('should include next step conditions when present', () => {
		const step: StepRecommendation = {
			step_description: 'Analysis step',
			expected_outcome: 'Analysis complete',
			recommended_tools: [
				{
					tool_name: 'analyze',
					confidence: 0.85,
					rationale: 'Analyze data',
					priority: 1,
				},
			],
			next_step_conditions: [
				'Verify information accuracy',
				'Look for implementation details',
			],
		};

		const result = formatRecommendation(step);

		expect(result).toContain('Conditions for next step:');
		expect(result).toContain('  - Verify information accuracy');
		expect(result).toContain('  - Look for implementation details');
	});

	it('should not include conditions section when next_step_conditions is absent', () => {
		const step: StepRecommendation = {
			step_description: 'Simple step',
			expected_outcome: 'Done',
			recommended_tools: [
				{
					tool_name: 'tool1',
					confidence: 0.8,
					rationale: 'Do it',
					priority: 1,
				},
			],
		};

		const result = formatRecommendation(step);

		expect(result).not.toContain('Conditions for next step');
	});

	it('should produce exact format matching original implementation', () => {
		const step: StepRecommendation = {
			step_description: 'Search documentation',
			expected_outcome: 'Find relevant docs',
			recommended_tools: [
				{
					tool_name: 'search_docs',
					confidence: 0.9,
					rationale: 'Find official docs',
					priority: 1,
					alternatives: ['web_search'],
					suggested_inputs: { query: 'svelte 5' },
				},
			],
			next_step_conditions: ['Verify accuracy'],
		};

		const result = formatRecommendation(step);

		const expected = `Step: Search documentation
Recommended Tools:
  - search_docs (priority: 1) (alternatives: web_search)
    Rationale: Find official docs
    Suggested inputs: ${JSON.stringify({ query: 'svelte 5' })}
Expected Outcome: Find relevant docs
Conditions for next step:
  - Verify accuracy`;

		expect(result).toBe(expected);
	});
});
