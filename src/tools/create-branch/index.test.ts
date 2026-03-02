import { describe, it, expect, beforeEach } from 'vitest';
import { createBranch } from './index.js';
import { ThoughtData } from '../sequentialthinking/types.js';

describe('createBranch', () => {
	let context: {
		thought_history: ThoughtData[];
		branches: Record<string, ThoughtData[]>;
	};

	beforeEach(() => {
		context = {
			thought_history: [
				{
					available_mcp_tools: ['tool1'],
					thought: 'Initial thought',
					thought_number: 1,
					total_thoughts: 5,
					next_thought_needed: true,
				},
				{
					available_mcp_tools: ['tool1'],
					thought: 'Second thought',
					thought_number: 2,
					total_thoughts: 5,
					next_thought_needed: true,
				},
			],
			branches: {},
		};
	});

	it('should create a new branch from an existing thought', async () => {
		const input = {
			thought_number: 1,
			branch_id: 'explore-alternative',
		};

		const result = await createBranch(input, context);

		expect(result.isError).toBeUndefined();
		expect(result.content).toHaveLength(1);
		expect(result.content[0].type).toBe('text');

		const payload = JSON.parse(result.content[0].text);
		expect(payload.status).toBe('created');
		expect(payload.branch_id).toBe('explore-alternative');
		expect(payload.branched_from_thought).toBe(1);
		expect(payload.branch_thought_count).toBe(0);
	});

	it('should register the branch in context.branches', async () => {
		const input = {
			thought_number: 1,
			branch_id: 'new-branch',
		};

		await createBranch(input, context);

		expect(context.branches['new-branch']).toBeDefined();
		expect(context.branches['new-branch']).toEqual([]);
	});

	it('should create branch with initial thought content when provided', async () => {
		const input = {
			thought_number: 2,
			branch_id: 'branch-with-thought',
			thought: 'Exploring a different approach',
		};

		const result = await createBranch(input, context);
		const payload = JSON.parse(result.content[0].text);

		expect(payload.status).toBe('created');
		expect(payload.branch_id).toBe('branch-with-thought');
		expect(payload.branched_from_thought).toBe(2);
		expect(payload.branch_thought_count).toBe(1);
		expect(context.branches['branch-with-thought']).toHaveLength(1);
		expect(context.branches['branch-with-thought'][0].thought).toBe('Exploring a different approach');
		expect(context.branches['branch-with-thought'][0].branch_from_thought).toBe(2);
		expect(context.branches['branch-with-thought'][0].branch_id).toBe('branch-with-thought');
	});

	it('should return error when thought_number does not exist in history', async () => {
		const input = {
			thought_number: 99,
			branch_id: 'bad-branch',
		};

		const result = await createBranch(input, context);

		expect(result.isError).toBe(true);
		const payload = JSON.parse(result.content[0].text);
		expect(payload.error).toContain('99');
		expect(payload.status).toBe('failed');
	});

	it('should return error when branch_id already exists', async () => {
		context.branches['existing-branch'] = [];

		const input = {
			thought_number: 1,
			branch_id: 'existing-branch',
		};

		const result = await createBranch(input, context);

		expect(result.isError).toBe(true);
		const payload = JSON.parse(result.content[0].text);
		expect(payload.error).toContain('existing-branch');
		expect(payload.status).toBe('failed');
	});

	it('should return existing branches list in response', async () => {
		context.branches['other-branch'] = [];

		const input = {
			thought_number: 1,
			branch_id: 'new-branch',
		};

		const result = await createBranch(input, context);
		const payload = JSON.parse(result.content[0].text);

		expect(payload.existing_branches).toContain('other-branch');
		expect(payload.existing_branches).toContain('new-branch');
	});

	it('should include source thought content in response', async () => {
		const input = {
			thought_number: 1,
			branch_id: 'my-branch',
		};

		const result = await createBranch(input, context);
		const payload = JSON.parse(result.content[0].text);

		expect(payload.source_thought).toBe('Initial thought');
	});

	it('should handle gracefully when context is invalid', async () => {
		const result = await createBranch(
			{ thought_number: 1, branch_id: 'test' },
			null as any,
		);

		expect(result.isError).toBe(true);
		expect(result.content[0].text).toContain('error');
	});

	it('should use available_mcp_tools from source thought when creating initial thought', async () => {
		context.thought_history[0].available_mcp_tools = ['search', 'fetch'];

		const input = {
			thought_number: 1,
			branch_id: 'tool-branch',
			thought: 'Branch with tools',
		};

		await createBranch(input, context);

		const branchThought = context.branches['tool-branch'][0];
		expect(branchThought.available_mcp_tools).toEqual(['search', 'fetch']);
	});
});
