import { describe, it, expect } from 'vitest';
import { addToBranch, getBranchStats, getAllBranchIds } from './branch.js';
import type { ThoughtData } from '../sequentialthinking/types.js';
import type { BranchStatistics } from '../branch-explorer/types.js';

function makeThought(overrides: Partial<ThoughtData> = {}): ThoughtData {
	return {
		available_mcp_tools: ['tool1'],
		thought: 'Test thought',
		thought_number: 1,
		total_thoughts: 3,
		next_thought_needed: true,
		...overrides,
	};
}

describe('addToBranch', () => {
	it('should create a new branch and add thought to it', () => {
		const branches: Record<string, ThoughtData[]> = {};
		const thought = makeThought({
			branch_id: 'alpha',
			branch_from_thought: 1,
			thought: 'Branch thought',
		});

		addToBranch(thought, branches);

		expect(branches['alpha']).toHaveLength(1);
		expect(branches['alpha'][0].thought).toBe('Branch thought');
	});

	it('should append to existing branch', () => {
		const branches: Record<string, ThoughtData[]> = {};
		const t1 = makeThought({ branch_id: 'alpha', branch_from_thought: 1, thought_number: 2, thought: 'First' });
		const t2 = makeThought({ branch_id: 'alpha', branch_from_thought: 1, thought_number: 3, thought: 'Second' });

		addToBranch(t1, branches);
		addToBranch(t2, branches);

		expect(branches['alpha']).toHaveLength(2);
		expect(branches['alpha'][0].thought).toBe('First');
		expect(branches['alpha'][1].thought).toBe('Second');
	});

	it('should handle multiple branches independently', () => {
		const branches: Record<string, ThoughtData[]> = {};

		addToBranch(makeThought({ branch_id: 'alpha', branch_from_thought: 1 }), branches);
		addToBranch(makeThought({ branch_id: 'beta', branch_from_thought: 1 }), branches);
		addToBranch(makeThought({ branch_id: 'alpha', branch_from_thought: 1, thought_number: 3 }), branches);

		expect(branches['alpha']).toHaveLength(2);
		expect(branches['beta']).toHaveLength(1);
	});

	it('should not add thought without branch_id', () => {
		const branches: Record<string, ThoughtData[]> = {};
		const thought = makeThought({ branch_from_thought: 1 });

		addToBranch(thought, branches);

		expect(Object.keys(branches)).toHaveLength(0);
	});

	it('should not add thought without branch_from_thought', () => {
		const branches: Record<string, ThoughtData[]> = {};
		const thought = makeThought({ branch_id: 'alpha' });

		addToBranch(thought, branches);

		expect(Object.keys(branches)).toHaveLength(0);
	});
});

describe('getBranchStats', () => {
	it('should return empty array for no branches', () => {
		const stats = getBranchStats({});

		expect(stats).toEqual([]);
	});

	it('should return statistics for a single branch', () => {
		const branches: Record<string, ThoughtData[]> = {
			'alpha': [
				makeThought({ branch_id: 'alpha', branch_from_thought: 1, thought_number: 2, total_thoughts: 5 }),
				makeThought({ branch_id: 'alpha', branch_from_thought: 1, thought_number: 3, total_thoughts: 5 }),
			],
		};

		const stats = getBranchStats(branches);

		expect(stats).toHaveLength(1);
		expect(stats[0].branch_id).toBe('alpha');
		expect(stats[0].total_thoughts).toBe(2);
		expect(stats[0].created_from_thought).toBe(1);
		expect(stats[0].last_thought_number).toBe(3);
		expect(stats[0].revision_count).toBe(0);
	});

	it('should calculate completion_percentage correctly', () => {
		const branches: Record<string, ThoughtData[]> = {
			'alpha': [
				makeThought({ branch_id: 'alpha', branch_from_thought: 1, thought_number: 1, total_thoughts: 4 }),
				makeThought({ branch_id: 'alpha', branch_from_thought: 1, thought_number: 2, total_thoughts: 4 }),
			],
		};

		const stats = getBranchStats(branches);

		expect(stats[0].completion_percentage).toBe(50);
	});

	it('should count revisions within a branch', () => {
		const branches: Record<string, ThoughtData[]> = {
			'alpha': [
				makeThought({ branch_id: 'alpha', branch_from_thought: 1, thought_number: 2 }),
				makeThought({ branch_id: 'alpha', branch_from_thought: 1, thought_number: 3, is_revision: true, revises_thought: 2 }),
			],
		};

		const stats = getBranchStats(branches);

		expect(stats[0].revision_count).toBe(1);
	});

	it('should calculate depth_score based on unique thought numbers', () => {
		const branches: Record<string, ThoughtData[]> = {
			'alpha': [
				makeThought({ branch_id: 'alpha', branch_from_thought: 1, thought_number: 2, total_thoughts: 10 }),
				makeThought({ branch_id: 'alpha', branch_from_thought: 1, thought_number: 2, total_thoughts: 10, is_revision: true, revises_thought: 2 }),
				makeThought({ branch_id: 'alpha', branch_from_thought: 1, thought_number: 3, total_thoughts: 10 }),
			],
		};

		const stats = getBranchStats(branches);

		// 3 thoughts / 2 unique thought_numbers = 1.5
		expect(stats[0].depth_score).toBe(1.5);
	});

	it('should skip empty branches', () => {
		const branches: Record<string, ThoughtData[]> = {
			'alpha': [
				makeThought({ branch_id: 'alpha', branch_from_thought: 1, thought_number: 2 }),
			],
			'empty': [],
		};

		const stats = getBranchStats(branches);

		expect(stats).toHaveLength(1);
		expect(stats[0].branch_id).toBe('alpha');
	});

	it('should return stats sorted by completion_percentage descending', () => {
		const branches: Record<string, ThoughtData[]> = {
			'low': [
				makeThought({ branch_id: 'low', branch_from_thought: 1, thought_number: 1, total_thoughts: 10 }),
			],
			'high': [
				makeThought({ branch_id: 'high', branch_from_thought: 1, thought_number: 1, total_thoughts: 2 }),
				makeThought({ branch_id: 'high', branch_from_thought: 1, thought_number: 2, total_thoughts: 2 }),
			],
		};

		const stats = getBranchStats(branches);

		expect(stats[0].branch_id).toBe('high');
		expect(stats[1].branch_id).toBe('low');
	});
});

describe('getAllBranchIds', () => {
	it('should return empty array for no branches', () => {
		expect(getAllBranchIds({})).toEqual([]);
	});

	it('should return all branch IDs', () => {
		const branches: Record<string, ThoughtData[]> = {
			'alpha': [makeThought()],
			'beta': [makeThought()],
			'gamma': [makeThought()],
		};

		const ids = getAllBranchIds(branches);

		expect(ids).toHaveLength(3);
		expect(ids).toContain('alpha');
		expect(ids).toContain('beta');
		expect(ids).toContain('gamma');
	});

	it('should include IDs of empty branches', () => {
		const branches: Record<string, ThoughtData[]> = {
			'alpha': [makeThought()],
			'empty': [],
		};

		const ids = getAllBranchIds(branches);

		expect(ids).toHaveLength(2);
		expect(ids).toContain('empty');
	});
});
