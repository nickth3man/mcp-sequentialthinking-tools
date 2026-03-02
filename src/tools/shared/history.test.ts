import { describe, it, expect } from 'vitest';
import { addToHistory, trimHistory, getHistoryStats } from './history.js';
import type { ThoughtData } from '../sequentialthinking/types.js';

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

describe('addToHistory', () => {
	it('should append a thought to empty history', () => {
		const history: ThoughtData[] = [];
		const thought = makeThought({ thought: 'First thought' });

		addToHistory(thought, history, 100);

		expect(history).toHaveLength(1);
		expect(history[0].thought).toBe('First thought');
	});

	it('should append multiple thoughts preserving order', () => {
		const history: ThoughtData[] = [];

		addToHistory(makeThought({ thought_number: 1, thought: 'A' }), history, 100);
		addToHistory(makeThought({ thought_number: 2, thought: 'B' }), history, 100);
		addToHistory(makeThought({ thought_number: 3, thought: 'C' }), history, 100);

		expect(history).toHaveLength(3);
		expect(history[0].thought).toBe('A');
		expect(history[2].thought).toBe('C');
	});

	it('should auto-trim when history exceeds maxSize', () => {
		const history: ThoughtData[] = [];

		for (let i = 1; i <= 5; i++) {
			addToHistory(makeThought({ thought_number: i, thought: `Thought ${i}` }), history, 3);
		}

		expect(history).toHaveLength(3);
		// Should keep the most recent 3
		expect(history[0].thought).toBe('Thought 3');
		expect(history[1].thought).toBe('Thought 4');
		expect(history[2].thought).toBe('Thought 5');
	});

	it('should handle maxSize of 1', () => {
		const history: ThoughtData[] = [];

		addToHistory(makeThought({ thought: 'First' }), history, 1);
		addToHistory(makeThought({ thought: 'Second' }), history, 1);

		expect(history).toHaveLength(1);
		expect(history[0].thought).toBe('Second');
	});
});

describe('trimHistory', () => {
	it('should not modify history within limit', () => {
		const history = [
			makeThought({ thought: 'A' }),
			makeThought({ thought: 'B' }),
		];

		trimHistory(history, 5);

		expect(history).toHaveLength(2);
	});

	it('should trim history to maxSize keeping recent items', () => {
		const history = [
			makeThought({ thought_number: 1, thought: 'A' }),
			makeThought({ thought_number: 2, thought: 'B' }),
			makeThought({ thought_number: 3, thought: 'C' }),
			makeThought({ thought_number: 4, thought: 'D' }),
			makeThought({ thought_number: 5, thought: 'E' }),
		];

		trimHistory(history, 3);

		expect(history).toHaveLength(3);
		expect(history[0].thought).toBe('C');
		expect(history[2].thought).toBe('E');
	});

	it('should handle empty history', () => {
		const history: ThoughtData[] = [];

		trimHistory(history, 5);

		expect(history).toHaveLength(0);
	});

	it('should handle maxSize equal to current length', () => {
		const history = [
			makeThought({ thought: 'A' }),
			makeThought({ thought: 'B' }),
		];

		trimHistory(history, 2);

		expect(history).toHaveLength(2);
		expect(history[0].thought).toBe('A');
	});
});

describe('getHistoryStats', () => {
	it('should return zero stats for empty history', () => {
		const stats = getHistoryStats([]);

		expect(stats).toEqual({
			total_thoughts: 0,
			revision_count: 0,
			branch_count: 0,
			unique_branch_ids: [],
		});
	});

	it('should count total thoughts', () => {
		const history = [
			makeThought({ thought_number: 1 }),
			makeThought({ thought_number: 2 }),
			makeThought({ thought_number: 3 }),
		];

		const stats = getHistoryStats(history);

		expect(stats.total_thoughts).toBe(3);
	});

	it('should count revisions', () => {
		const history = [
			makeThought({ thought_number: 1 }),
			makeThought({ thought_number: 2, is_revision: true, revises_thought: 1 }),
			makeThought({ thought_number: 3 }),
			makeThought({ thought_number: 4, is_revision: true, revises_thought: 2 }),
		];

		const stats = getHistoryStats(history);

		expect(stats.revision_count).toBe(2);
	});

	it('should count branches and list unique branch IDs', () => {
		const history = [
			makeThought({ thought_number: 1 }),
			makeThought({ thought_number: 2, branch_id: 'alpha', branch_from_thought: 1 }),
			makeThought({ thought_number: 3, branch_id: 'alpha', branch_from_thought: 1 }),
			makeThought({ thought_number: 2, branch_id: 'beta', branch_from_thought: 1 }),
		];

		const stats = getHistoryStats(history);

		expect(stats.branch_count).toBe(3);
		expect(stats.unique_branch_ids).toEqual(['alpha', 'beta']);
	});

	it('should handle history with no revisions or branches', () => {
		const history = [
			makeThought({ thought_number: 1 }),
			makeThought({ thought_number: 2 }),
		];

		const stats = getHistoryStats(history);

		expect(stats.revision_count).toBe(0);
		expect(stats.branch_count).toBe(0);
		expect(stats.unique_branch_ids).toEqual([]);
	});
});
