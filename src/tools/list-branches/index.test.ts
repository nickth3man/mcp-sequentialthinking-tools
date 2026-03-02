import { describe, it, expect, beforeEach } from 'vitest';
import { listBranches } from './index.js';
import { ThoughtData } from '../sequentialthinking/types.js';

describe('listBranches', () => {
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

	it('should return empty list when no branches exist', async () => {
		const result = await listBranches({}, context);

		expect(result.isError).toBeUndefined();
		const payload = JSON.parse(result.content[0].text);
		expect(payload.branches).toEqual([]);
		expect(payload.total_branches).toBe(0);
	});

	it('should list all branches with statistics', async () => {
		context.branches = {
			'branch-a': [
				createThought({ branch_from_thought: 1, thought_number: 2, total_thoughts: 5 }),
				createThought({ branch_from_thought: 1, thought_number: 3, total_thoughts: 5 }),
			],
			'branch-b': [
				createThought({ branch_from_thought: 2, thought_number: 3, total_thoughts: 4 }),
			],
		};

		const result = await listBranches({}, context);

		const payload = JSON.parse(result.content[0].text);
		expect(payload.branches).toHaveLength(2);
		expect(payload.total_branches).toBe(2);

		const branchA = payload.branches.find((b: any) => b.branch_id === 'branch-a');
		expect(branchA.total_thoughts).toBe(2);
		expect(branchA.completion_percentage).toBe(40); // 2/5 = 40%
		expect(branchA.created_from_thought).toBe(1);
	});

	it('should filter branches by min_completion_threshold', async () => {
		context.branches = {
			'high-completion': [
				createThought({ thought_number: 1, total_thoughts: 2 }),
				createThought({ thought_number: 2, total_thoughts: 2 }),
			],
			'low-completion': [
				createThought({ thought_number: 1, total_thoughts: 10 }),
			],
		};

		const result = await listBranches({ min_completion_threshold: 50 }, context);

		const payload = JSON.parse(result.content[0].text);
		expect(payload.branches).toHaveLength(1);
		expect(payload.branches[0].branch_id).toBe('high-completion');
	});

	it('should calculate depth score correctly', async () => {
		context.branches = {
			'branch-with-revisions': [
				createThought({ thought_number: 2, total_thoughts: 5 }),
				createThought({ thought_number: 2, total_thoughts: 5, is_revision: true }),
				createThought({ thought_number: 3, total_thoughts: 5 }),
			],
		};

		const result = await listBranches({}, context);

		const payload = JSON.parse(result.content[0].text);
		expect(payload.branches[0].revision_count).toBe(1);
		expect(payload.branches[0].depth_score).toBe(1.5); // 3 thoughts / 2 unique steps
	});

	it('should sort branches by completion percentage descending', async () => {
		context.branches = {
			'low': [createThought({ thought_number: 1, total_thoughts: 10 })],
			'high': Array.from({ length: 9 }, (_, i) => createThought({ thought_number: i + 1, total_thoughts: 10 })),
			'medium': Array.from({ length: 5 }, (_, i) => createThought({ thought_number: i + 1, total_thoughts: 10 })),
		};

		const result = await listBranches({}, context);

		const payload = JSON.parse(result.content[0].text);
		expect(payload.branches[0].branch_id).toBe('high');
		expect(payload.branches[1].branch_id).toBe('medium');
		expect(payload.branches[2].branch_id).toBe('low');
	});

	it('should skip empty branches', async () => {
		context.branches = {
			'empty': [],
			'non-empty': [createThought({ thought_number: 1, total_thoughts: 5 })],
		};

		const result = await listBranches({}, context);

		const payload = JSON.parse(result.content[0].text);
		expect(payload.branches).toHaveLength(1);
		expect(payload.branches[0].branch_id).toBe('non-empty');
	});

	it('should return error response on exception', async () => {
		const result = await listBranches({}, null as any);

		expect(result.isError).toBe(true);
		expect(result.content[0].text).toContain('error');
	});
});
