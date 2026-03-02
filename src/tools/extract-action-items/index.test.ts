import { describe, it, expect, beforeEach } from 'vitest';
import { extractActionItems } from './index.js';
import { ThoughtData } from '../sequentialthinking/types.js';

describe('extract-action-items', () => {
	let thought_history: ThoughtData[];
	let branches: Record<string, ThoughtData[]>;

	beforeEach(() => {
		thought_history = [
			{
				available_mcp_tools: ['tool1'],
				thought: 'We need to research the API documentation first',
				thought_number: 1,
				total_thoughts: 4,
				next_thought_needed: true,
			},
			{
				available_mcp_tools: ['tool1'],
				thought: 'TODO: Set up the database schema before implementing',
				thought_number: 2,
				total_thoughts: 4,
				next_thought_needed: true,
			},
			{
				available_mcp_tools: ['tool1'],
				thought: 'The implementation looks good, no further actions needed',
				thought_number: 3,
				total_thoughts: 4,
				next_thought_needed: true,
			},
			{
				available_mcp_tools: ['tool1'],
				thought: 'ACTION: Deploy to staging environment for testing',
				thought_number: 4,
				total_thoughts: 4,
				next_thought_needed: false,
			},
		];
		branches = {};
	});

	describe('basic extraction', () => {
		it('should extract action items from thoughts', async () => {
			const result = await extractActionItems(
				{ scope: 'all', include_completed: false },
				{ thought_history, branches }
			);

			expect(result.isError).toBeUndefined();
			const data = JSON.parse(result.content[0].text);
			expect(data.action_items).toBeDefined();
			expect(data.action_items.length).toBeGreaterThan(0);
		});

		it('should identify explicit TODO markers', async () => {
			const result = await extractActionItems(
				{ scope: 'all', include_completed: false },
				{ thought_history, branches }
			);

			const data = JSON.parse(result.content[0].text);
			const hasTodo = data.action_items.some((item: { text: string }) => 
				item.text.toLowerCase().includes('set up the database')
			);
			expect(hasTodo).toBe(true);
		});

		it('should identify explicit ACTION markers', async () => {
			const result = await extractActionItems(
				{ scope: 'all', include_completed: false },
				{ thought_history, branches }
			);

			const data = JSON.parse(result.content[0].text);
			const hasAction = data.action_items.some((item: { text: string }) => 
				item.text.toLowerCase().includes('deploy to staging')
			);
			expect(hasAction).toBe(true);
		});
	});

	describe('scope filtering', () => {
		it('should filter by scope: incomplete only', async () => {
			thought_history[1].current_step = {
				step_description: 'Set up database',
				recommended_tools: [],
				expected_outcome: 'Schema ready',
			};

			const result = await extractActionItems(
				{ scope: 'incomplete', include_completed: false },
				{ thought_history, branches }
			);

			const data = JSON.parse(result.content[0].text);
			expect(data.action_items.every((item: { status: string }) =>
				item.status === 'pending'
			)).toBe(true);
		});
	});

	describe('priority detection', () => {
		it('should detect high priority from urgent language', async () => {
			thought_history.push({
				available_mcp_tools: ['tool1'],
				thought: 'URGENT: Fix security vulnerability immediately',
				thought_number: 5,
				total_thoughts: 5,
				next_thought_needed: false,
			});

			const result = await extractActionItems(
				{ scope: 'all', include_completed: false },
				{ thought_history, branches }
			);

			const data = JSON.parse(result.content[0].text);
			const urgentItem = data.action_items.find((item: { text: string }) =>
				item.text.includes('security')
			);
			expect(urgentItem?.priority).toBe('high');
		});
	});

	describe('thought references', () => {
		it('should include thought_number for each action item', async () => {
			const result = await extractActionItems(
				{ scope: 'all', include_completed: false },
				{ thought_history, branches }
			);

			const data = JSON.parse(result.content[0].text);
			expect(data.action_items.every((item: { thought_number: number }) =>
				typeof item.thought_number === 'number'
			)).toBe(true);
		});
	});

	describe('edge cases', () => {
		it('should handle empty thought history', async () => {
			const result = await extractActionItems(
				{ scope: 'all', include_completed: false },
				{ thought_history: [], branches: {} }
			);

			expect(result.isError).toBeUndefined();
			const data = JSON.parse(result.content[0].text);
			expect(data.action_items).toHaveLength(0);
		});

		it('should handle thoughts without action items', async () => {
			const cleanThoughts = [
				{
					available_mcp_tools: ['tool1'],
					thought: 'This is just a regular thought with no actions',
					thought_number: 1,
					total_thoughts: 1,
					next_thought_needed: false,
				},
			];

			const result = await extractActionItems(
				{ scope: 'all', include_completed: false },
				{ thought_history: cleanThoughts, branches: {} }
			);

			const data = JSON.parse(result.content[0].text);
			expect(data.action_items).toHaveLength(0);
		});
	});
});
