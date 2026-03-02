import { describe, it, expect, beforeEach } from 'vitest';
import { recommendBranch } from './index.js';
import { ThoughtData } from '../sequentialthinking/types.js';

describe('recommendBranch', () => {
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

	it('should return message when no branches exist', async () => {
		const result = await recommendBranch({}, context);

		expect(result.isError).toBeUndefined();
		const payload = JSON.parse(result.content[0].text);
		expect(payload.recommendation).toBe('No branches available');
		expect(payload.branches).toEqual([]);
		expect(payload.best_branch_id).toBeUndefined();
	});

	it('should recommend single branch when only one exists', async () => {
		context.branches = {
			'branch-a': [
				createThought({ branch_from_thought: 1, thought_number: 2, total_thoughts: 5 }),
				createThought({ branch_from_thought: 1, thought_number: 3, total_thoughts: 5 }),
			],
		};

		const result = await recommendBranch({}, context);

		const payload = JSON.parse(result.content[0].text);
		expect(payload.best_branch_id).toBe('branch-a');
		expect(payload.branches).toHaveLength(1);
		expect(payload.reasoning).toContain('branch-a');
	});

	it('should recommend best branch from multiple branches', async () => {
		// Branch 'best': high completion, good depth, few revisions
		// Score: 80 + (1.0 * 10) - (0 * 5) = 90
		context.branches = {
			'best': [
				createThought({ branch_from_thought: 1, thought_number: 1, total_thoughts: 5 }),
				createThought({ branch_from_thought: 1, thought_number: 2, total_thoughts: 5 }),
				createThought({ branch_from_thought: 1, thought_number: 3, total_thoughts: 5 }),
				createThought({ branch_from_thought: 1, thought_number: 4, total_thoughts: 5 }),
			],
			'worst': [
				createThought({ branch_from_thought: 2, thought_number: 1, total_thoughts: 10 }),
			],
		};

		const result = await recommendBranch({}, context);

		const payload = JSON.parse(result.content[0].text);
		expect(payload.best_branch_id).toBe('best');
		expect(payload.branches).toHaveLength(2);
		
		// Verify sorting (best first)
		expect(payload.branches[0].branch_id).toBe('best');
		expect(payload.branches[1].branch_id).toBe('worst');
	});

	it('should calculate score correctly with all factors', async () => {
		// Branch 'high-score': 80% completion, depth 1.5, 0 revisions
		// Score: 80 + (1.5 * 10) - (0 * 5) = 95
		// Branch 'low-score': 20% completion, depth 1.0, 2 revisions
		// Score: 20 + (1.0 * 10) - (2 * 5) = 20
		context.branches = {
			'high-score': [
				createThought({ branch_from_thought: 1, thought_number: 1, total_thoughts: 5 }),
				createThought({ branch_from_thought: 1, thought_number: 2, total_thoughts: 5 }),
				createThought({ branch_from_thought: 1, thought_number: 2, total_thoughts: 5, is_revision: true }),
				createThought({ branch_from_thought: 1, thought_number: 3, total_thoughts: 5 }),
				createThought({ branch_from_thought: 1, thought_number: 3, total_thoughts: 5, is_revision: true }),
				createThought({ branch_from_thought: 1, thought_number: 4, total_thoughts: 5 }),
			],
			'low-score': [
				createThought({ branch_from_thought: 2, thought_number: 1, total_thoughts: 5 }),
				createThought({ branch_from_thought: 2, thought_number: 2, total_thoughts: 5, is_revision: true }),
				createThought({ branch_from_thought: 2, thought_number: 2, total_thoughts: 5, is_revision: true }),
				createThought({ branch_from_thought: 2, thought_number: 2, total_thoughts: 5, is_revision: true }),
			],
		};

		const result = await recommendBranch({}, context);

		const payload = JSON.parse(result.content[0].text);
		expect(payload.best_branch_id).toBe('high-score');
		expect(payload.reasoning).toContain('score');
	});

	it('should skip empty branches', async () => {
		context.branches = {
			'empty': [],
			'valid': [createThought({ thought_number: 1, total_thoughts: 5 })],
		};

		const result = await recommendBranch({}, context);

		const payload = JSON.parse(result.content[0].text);
		expect(payload.branches).toHaveLength(1);
		expect(payload.best_branch_id).toBe('valid');
	});

	it('should return error response on exception', async () => {
		const result = await recommendBranch({}, null as any);

		expect(result.isError).toBe(true);
		expect(result.content[0].text).toContain('error');
	});
});
