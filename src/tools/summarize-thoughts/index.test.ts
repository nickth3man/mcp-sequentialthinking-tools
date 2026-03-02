import { describe, it, expect, beforeEach } from 'vitest';
import { summarizeThoughts } from './index.js';
import { ThoughtData } from '../sequentialthinking/types.js';

describe('summarize-thoughts', () => {
	let thought_history: ThoughtData[];
	let branches: Record<string, ThoughtData[]>;

	beforeEach(() => {
		thought_history = [
			{
				available_mcp_tools: ['tool1'],
				thought: 'Initial problem: We need to design a scalable database schema',
				thought_number: 1,
				total_thoughts: 4,
				next_thought_needed: true,
				current_step: {
					step_description: 'Analyze requirements',
					recommended_tools: [{ tool_name: 'tool1', confidence: 0.9, rationale: 'good', priority: 1 }],
					expected_outcome: 'Clear requirements',
				},
			},
			{
				available_mcp_tools: ['tool1'],
				thought: 'Consideration: PostgreSQL would be a good choice for relational data',
				thought_number: 2,
				total_thoughts: 4,
				next_thought_needed: true,
				current_step: {
					step_description: 'Evaluate database options',
					recommended_tools: [{ tool_name: 'tool1', confidence: 0.9, rationale: 'good', priority: 1 }],
					expected_outcome: 'Database selected',
				},
			},
			{
				available_mcp_tools: ['tool1'],
				thought: 'Decision: Use PostgreSQL with proper indexing strategy',
				thought_number: 3,
				total_thoughts: 4,
				next_thought_needed: true,
				current_step: {
					step_description: 'Finalize database choice',
					recommended_tools: [{ tool_name: 'tool1', confidence: 0.9, rationale: 'good', priority: 1 }],
					expected_outcome: 'Decision made',
				},
			},
			{
				available_mcp_tools: ['tool1'],
				thought: 'Next steps: Design schema, create migrations, implement queries',
				thought_number: 4,
				total_thoughts: 4,
				next_thought_needed: false,
			},
		];
		branches = {};
	});

	describe('basic summarization', () => {
		it('should generate summary of all thoughts', async () => {
			const result = await summarizeThoughts(
				{ start_thought: 1, end_thought: 4, detail_level: 'medium' },
				{ thought_history, branches }
			);

			expect(result.isError).toBeUndefined();
			const data = JSON.parse(result.content[0].text);
			expect(data.summary).toBeDefined();
			expect(data.summary.length).toBeGreaterThan(0);
		});

		it('should include key points in summary', async () => {
			const result = await summarizeThoughts(
				{ start_thought: 1, end_thought: 4, detail_level: 'medium' },
				{ thought_history, branches }
			);

			const data = JSON.parse(result.content[0].text);
			expect(data.key_points).toBeDefined();
			expect(data.key_points.length).toBeGreaterThan(0);
		});

		it('should identify decisions made', async () => {
			const result = await summarizeThoughts(
				{ start_thought: 1, end_thought: 4, detail_level: 'medium' },
				{ thought_history, branches }
			);

			const data = JSON.parse(result.content[0].text);
			expect(data.decisions).toBeDefined();
			expect(data.decisions.some((d: string) => d.includes('PostgreSQL'))).toBe(true);
		});
	});

	describe('detail levels', () => {
		it('should provide brief summary for low detail', async () => {
			const result = await summarizeThoughts(
				{ start_thought: 1, end_thought: 4, detail_level: 'low' },
				{ thought_history, branches }
			);

			const data = JSON.parse(result.content[0].text);
			expect(data.summary.split(' ').length).toBeLessThan(50);
		});

		it('should provide detailed summary for high detail', async () => {
			const result = await summarizeThoughts(
				{ start_thought: 1, end_thought: 4, detail_level: 'high' },
				{ thought_history, branches }
			);

			const data = JSON.parse(result.content[0].text);
			expect(data.summary.length).toBeGreaterThan(data.key_points.join(' ').length);
		});
	});

	describe('action items', () => {
		it('should extract action items from thoughts', async () => {
			const result = await summarizeThoughts(
				{ start_thought: 1, end_thought: 4, detail_level: 'medium', include_action_items: true },
				{ thought_history, branches }
			);

			const data = JSON.parse(result.content[0].text);
			expect(data.action_items).toBeDefined();
			expect(data.action_items.length).toBeGreaterThan(0);
		});
	});

	describe('edge cases', () => {
		it('should handle single thought range', async () => {
			const result = await summarizeThoughts(
				{ start_thought: 1, end_thought: 1, detail_level: 'medium' },
				{ thought_history, branches }
			);

			expect(result.isError).toBeUndefined();
			const data = JSON.parse(result.content[0].text);
			expect(data.thoughts_included).toBe(1);
		});

		it('should return error for invalid range', async () => {
			const result = await summarizeThoughts(
				{ start_thought: 5, end_thought: 1, detail_level: 'medium' },
				{ thought_history, branches }
			);

			expect(result.isError).toBe(true);
		});

		it('should handle empty thought history', async () => {
			const result = await summarizeThoughts(
				{ start_thought: 1, end_thought: 1, detail_level: 'medium' },
				{ thought_history: [], branches: {} }
			);

			expect(result.isError).toBe(true);
		});
	});
});
