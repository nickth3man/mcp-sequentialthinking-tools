import { describe, it, expect, beforeEach } from 'vitest';
import { compareBranches } from './index.js';
import { ThoughtData } from '../sequentialthinking/types.js';

describe('compareBranches', () => {
	let context: {
		branches: Record<string, ThoughtData[]>;
	};

	function createThought(overrides: Partial<ThoughtData> = {}): ThoughtData {
		return {
			available_mcp_tools: ['tool1'],
			thought: 'Test thought',
			thought_number: 1,
			total_thoughts: 5,
			next_thought_needed: true,
			...overrides,
		};
	}

	beforeEach(() => {
		context = {
			branches: {},
		};
	});

	it('should require at least 2 branch_ids', async () => {
		const result = await compareBranches({ branch_ids: ['branch-a'] }, context);

		expect(result.isError).toBe(true);
		expect(result.content[0].text).toContain('at least 2 branch_ids');
	});

	it('should require branch_ids to be provided', async () => {
		const result = await compareBranches({ branch_ids: [] }, context);

		expect(result.isError).toBe(true);
		expect(result.content[0].text).toContain('at least 2 branch_ids');
	});

	it('should return empty comparison for non-existent branches', async () => {
		const result = await compareBranches(
			{ branch_ids: ['non-existent-1', 'non-existent-2'] },
			context
		);

		const payload = JSON.parse(result.content[0].text);
		expect(payload.branches).toEqual([]);
		expect(payload.recommendation).toContain('No valid branches');
	});

	it('should compare multiple branches and recommend best', async () => {
		context.branches = {
			'branch-a': [
				createThought({ thought_number: 1, total_thoughts: 5 }),
				createThought({ thought_number: 2, total_thoughts: 5 }),
				createThought({ thought_number: 3, total_thoughts: 5 }),
			],
			'branch-b': [
				createThought({ thought_number: 1, total_thoughts: 5 }),
			],
		};

		const result = await compareBranches(
			{ branch_ids: ['branch-a', 'branch-b'] },
			context
		);

		const payload = JSON.parse(result.content[0].text);
		expect(payload.branches).toHaveLength(2);
		expect(payload.best_branch_id).toBe('branch-a');
		expect(payload.recommendation).toContain('branch-a');
	});

	it('should include reasoning in comparison', async () => {
		context.branches = {
			'branch-a': [
				createThought({ thought_number: 1, total_thoughts: 5 }),
				createThought({ thought_number: 2, total_thoughts: 5 }),
			],
			'branch-b': [
				createThought({ thought_number: 1, total_thoughts: 5 }),
			],
		};

		const result = await compareBranches(
			{ branch_ids: ['branch-a', 'branch-b'] },
			context
		);

		const payload = JSON.parse(result.content[0].text);
		expect(payload.reasoning).toBeDefined();
		expect(payload.reasoning.length).toBeGreaterThan(0);
	});

	it('should score based on completion, depth, and stability', async () => {
		context.branches = {
			'high-revisions': [
				createThought({ thought_number: 1, total_thoughts: 3, is_revision: true }),
				createThought({ thought_number: 2, total_thoughts: 3, is_revision: true }),
				createThought({ thought_number: 3, total_thoughts: 3 }),
			],
			'stable': [
				createThought({ thought_number: 1, total_thoughts: 3 }),
				createThought({ thought_number: 2, total_thoughts: 3 }),
				createThought({ thought_number: 3, total_thoughts: 3 }),
			],
		};

		const result = await compareBranches(
			{ branch_ids: ['high-revisions', 'stable'] },
			context
		);

		const payload = JSON.parse(result.content[0].text);
		// stable branch should win because fewer revisions
		expect(payload.best_branch_id).toBe('stable');
	});

	it('should only compare requested branches', async () => {
		context.branches = {
			'branch-a': [createThought({ thought_number: 1, total_thoughts: 5 })],
			'branch-b': [createThought({ thought_number: 1, total_thoughts: 5 })],
			'branch-c': [createThought({ thought_number: 1, total_thoughts: 5 })],
		};

		const result = await compareBranches(
			{ branch_ids: ['branch-a', 'branch-b'] },
			context
		);

		const payload = JSON.parse(result.content[0].text);
		expect(payload.branches).toHaveLength(2);
		const ids = payload.branches.map((b: any) => b.branch_id);
		expect(ids).not.toContain('branch-c');
	});

	it('should return error response on exception', async () => {
		const result = await compareBranches({ branch_ids: ['a', 'b'] }, null as any);

		expect(result.isError).toBe(true);
		expect(result.content[0].text).toContain('error');
	});
});
