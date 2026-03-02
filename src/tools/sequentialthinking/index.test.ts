import { describe, it, expect, beforeEach } from 'vitest';
import { processThought } from './index.js';
import { ThoughtData } from './types.js';

describe('processThought', () => {
	let context: {
		thought_history: ThoughtData[];
		branches: Record<string, ThoughtData[]>;
		maxHistorySize: number;
		maxBranchSize: number;
	};

	beforeEach(() => {
		context = {
			thought_history: [],
			branches: {},
			maxHistorySize: 1000,
			maxBranchSize: 500,
		};
	});

	it('should process a basic thought and return structured response', async () => {
		const input = {
			available_mcp_tools: ['search_docs'],
			thought: 'Initial research step',
			thought_number: 1,
			total_thoughts: 3,
			next_thought_needed: true,
		};

		const result = await processThought(input, context);

		expect(result.isError).toBeUndefined();
		expect(result.content).toHaveLength(1);
		expect(result.content[0].type).toBe('text');

		const payload = JSON.parse(result.content[0].text);
		expect(payload.thought_number).toBe(1);
		expect(payload.total_thoughts).toBe(3);
		expect(payload.next_thought_needed).toBe(true);
		expect(payload.branches).toEqual([]);
		expect(payload.thought_history_length).toBe(1);
	});

	it('should store thought in history', async () => {
		const input = {
			available_mcp_tools: ['tool1'],
			thought: 'Test thought',
			thought_number: 1,
			total_thoughts: 1,
			next_thought_needed: false,
		};

		await processThought(input, context);

		expect(context.thought_history).toHaveLength(1);
		expect(context.thought_history[0].thought).toBe('Test thought');
	});

	it('should adjust total_thoughts if thought_number exceeds it', async () => {
		const input = {
			available_mcp_tools: ['tool1'],
			thought: 'Thought 5',
			thought_number: 5,
			total_thoughts: 3,
			next_thought_needed: true,
		};

		const result = await processThought(input, context);
		const payload = JSON.parse(result.content[0].text);

		expect(payload.total_thoughts).toBe(5);
	});

	it('should store current_step in previous_steps', async () => {
		const input = {
			available_mcp_tools: ['search_docs'],
			thought: 'Research step',
			thought_number: 1,
			total_thoughts: 2,
			next_thought_needed: true,
			current_step: {
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
			},
		};

		const result = await processThought(input, context);
		const payload = JSON.parse(result.content[0].text);

		expect(payload.previous_steps).toHaveLength(1);
		expect(payload.previous_steps[0].step_description).toBe('Search documentation');
	});

	it('should create a branch when branch_from_thought and branch_id are provided', async () => {
		const input = {
			available_mcp_tools: ['tool1'],
			thought: 'Branch thought',
			thought_number: 2,
			total_thoughts: 5,
			next_thought_needed: true,
			branch_from_thought: 1,
			branch_id: 'branch-a',
		};

		const result = await processThought(input, context);
		const payload = JSON.parse(result.content[0].text);

		expect(payload.branches).toContain('branch-a');
		expect(context.branches['branch-a']).toHaveLength(1);
		expect(context.branches['branch-a'][0].thought).toBe('Branch thought');
	});

	it('should handle multiple thoughts in the same branch', async () => {
		const inputs = [
			{
				available_mcp_tools: ['tool1'],
				thought: 'Branch thought 1',
				thought_number: 2,
				total_thoughts: 5,
				next_thought_needed: true,
				branch_from_thought: 1,
				branch_id: 'branch-a',
			},
			{
				available_mcp_tools: ['tool1'],
				thought: 'Branch thought 2',
				thought_number: 3,
				total_thoughts: 5,
				next_thought_needed: true,
				branch_from_thought: 1,
				branch_id: 'branch-a',
			},
		];

		for (const input of inputs) {
			await processThought(input, context);
		}

		expect(context.branches['branch-a']).toHaveLength(2);
	});

	it('should trim history when exceeding maxHistorySize', async () => {
		context.maxHistorySize = 3;

		for (let i = 1; i <= 5; i++) {
			await processThought(
				{
					available_mcp_tools: ['tool1'],
					thought: `Thought ${i}`,
					thought_number: i,
					total_thoughts: 5,
					next_thought_needed: true,
				},
				context
			);
		}

		expect(context.thought_history).toHaveLength(3);
		expect(context.thought_history[0].thought).toBe('Thought 3');
		expect(context.thought_history[2].thought).toBe('Thought 5');
	});

	it('should handle revisions', async () => {
		const input = {
			available_mcp_tools: ['tool1'],
			thought: 'Revised thought',
			thought_number: 2,
			total_thoughts: 3,
			next_thought_needed: true,
			is_revision: true,
			revises_thought: 1,
		};

		const result = await processThought(input, context);
		expect(result.isError).toBeUndefined();
		expect(context.thought_history[0].is_revision).toBe(true);
		expect(context.thought_history[0].revises_thought).toBe(1);
	});

	it('should return error response on exception', async () => {
		// Create a scenario that causes an error by passing invalid context
		const result = await processThought(null as any, null as any);

		expect(result.isError).toBe(true);
		expect(result.content[0].text).toContain('error');
	});
});
