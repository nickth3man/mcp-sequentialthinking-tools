import { describe, it, expect, beforeEach } from 'vitest';
import { getThoughtHistory } from './index.js';
import { ThoughtData } from '../sequentialthinking/types.js';

describe('getThoughtHistory', () => {
	let thought_history: ThoughtData[];

	beforeEach(() => {
		thought_history = [];
	});

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

	it('should return empty history when no thoughts exist', async () => {
		const input = {};
		const result = await getThoughtHistory(input, { thought_history });

		expect(result.isError).toBeUndefined();
		const payload = JSON.parse(result.content[0].text);
		expect(payload.thoughts).toEqual([]);
		expect(payload.total_count).toBe(0);
	});

	it('should return all thoughts by default', async () => {
		thought_history = [
			createThought({ thought: 'Thought 1', thought_number: 1 }),
			createThought({ thought: 'Thought 2', thought_number: 2 }),
			createThought({ thought: 'Thought 3', thought_number: 3 }),
		];

		const result = await getThoughtHistory({}, { thought_history });
		const payload = JSON.parse(result.content[0].text);

		expect(payload.thoughts).toHaveLength(3);
		expect(payload.total_count).toBe(3);
		expect(payload.thoughts[0].thought).toBe('Thought 1');
		expect(payload.thoughts[2].thought).toBe('Thought 3');
	});

	it('should limit results when limit is specified', async () => {
		thought_history = [
			createThought({ thought: 'Thought 1', thought_number: 1 }),
			createThought({ thought: 'Thought 2', thought_number: 2 }),
			createThought({ thought: 'Thought 3', thought_number: 3 }),
		];

		const result = await getThoughtHistory({ limit: 2 }, { thought_history });
		const payload = JSON.parse(result.content[0].text);

		expect(payload.thoughts).toHaveLength(2);
		expect(payload.total_count).toBe(3);
	});

	it('should offset results when offset is specified', async () => {
		thought_history = [
			createThought({ thought: 'Thought 1', thought_number: 1 }),
			createThought({ thought: 'Thought 2', thought_number: 2 }),
			createThought({ thought: 'Thought 3', thought_number: 3 }),
		];

		const result = await getThoughtHistory({ offset: 1, limit: 2 }, { thought_history });
		const payload = JSON.parse(result.content[0].text);

		expect(payload.thoughts).toHaveLength(2);
		expect(payload.thoughts[0].thought).toBe('Thought 2');
		expect(payload.thoughts[1].thought).toBe('Thought 3');
	});

	it('should filter by branch_id when specified', async () => {
		thought_history = [
			createThought({ thought: 'Main thought', thought_number: 1 }),
			createThought({ thought: 'Branch A thought', thought_number: 2, branch_id: 'branch-a' }),
			createThought({ thought: 'Branch B thought', thought_number: 3, branch_id: 'branch-b' }),
			createThought({ thought: 'Another main', thought_number: 4 }),
		];

		const result = await getThoughtHistory({ branch_id: 'branch-a' }, { thought_history });
		const payload = JSON.parse(result.content[0].text);

		expect(payload.thoughts).toHaveLength(1);
		expect(payload.thoughts[0].thought).toBe('Branch A thought');
		expect(payload.total_count).toBe(1);
	});

	it('should include branch info when include_branch_info is true', async () => {
		thought_history = [
			createThought({ 
				thought: 'Branch thought', 
				thought_number: 2, 
				branch_id: 'branch-a',
				branch_from_thought: 1 
			}),
		];

		const result = await getThoughtHistory({ include_branch_info: true }, { thought_history });
		const payload = JSON.parse(result.content[0].text);

		expect(payload.thoughts[0].branch_id).toBe('branch-a');
		expect(payload.thoughts[0].branch_from_thought).toBe(1);
	});

	it('should filter revisions when include_revisions is false', async () => {
		thought_history = [
			createThought({ thought: 'Original', thought_number: 1 }),
			createThought({ thought: 'Revision', thought_number: 2, is_revision: true, revises_thought: 1 }),
			createThought({ thought: 'Normal', thought_number: 3 }),
		];

		const result = await getThoughtHistory({ include_revisions: false }, { thought_history });
		const payload = JSON.parse(result.content[0].text);

		expect(payload.thoughts).toHaveLength(2);
		expect(payload.thoughts.some((t: any) => t.is_revision)).toBe(false);
	});

	it('should include revisions by default', async () => {
		thought_history = [
			createThought({ thought: 'Original', thought_number: 1 }),
			createThought({ thought: 'Revision', thought_number: 2, is_revision: true }),
		];

		const result = await getThoughtHistory({}, { thought_history });
		const payload = JSON.parse(result.content[0].text);

		expect(payload.thoughts).toHaveLength(2);
	});

	it('should return thoughts in reverse order when reverse is true', async () => {
		thought_history = [
			createThought({ thought: 'First', thought_number: 1 }),
			createThought({ thought: 'Second', thought_number: 2 }),
			createThought({ thought: 'Third', thought_number: 3 }),
		];

		const result = await getThoughtHistory({ reverse: true }, { thought_history });
		const payload = JSON.parse(result.content[0].text);

		expect(payload.thoughts[0].thought).toBe('Third');
		expect(payload.thoughts[2].thought).toBe('First');
	});

	it('should handle combined filters', async () => {
		thought_history = [
			createThought({ thought: 'A1', thought_number: 1, branch_id: 'branch-a' }),
			createThought({ thought: 'A2', thought_number: 2, branch_id: 'branch-a' }),
			createThought({ thought: 'B1', thought_number: 3, branch_id: 'branch-b' }),
			createThought({ thought: 'A3-revision', thought_number: 4, branch_id: 'branch-a', is_revision: true }),
		];

		const result = await getThoughtHistory(
			{ 
				branch_id: 'branch-a', 
				include_revisions: false,
				limit: 1 
			}, 
			{ thought_history }
		);
		const payload = JSON.parse(result.content[0].text);

		expect(payload.thoughts).toHaveLength(1);
		expect(payload.thoughts[0].thought).toBe('A1');
		expect(payload.total_count).toBe(2); // 2 non-revision thoughts in branch-a
	});

	it('should return summary statistics', async () => {
		thought_history = [
			createThought({ thought: 'Main', thought_number: 1 }),
			createThought({ thought: 'Branch', thought_number: 2, branch_id: 'branch-a' }),
			createThought({ thought: 'Revision', thought_number: 3, is_revision: true }),
		];

		const result = await getThoughtHistory({}, { thought_history });
		const payload = JSON.parse(result.content[0].text);

		expect(payload.summary).toBeDefined();
		expect(payload.summary.total_thoughts).toBe(3);
		expect(payload.summary.revision_count).toBe(1);
		expect(payload.summary.branches).toContain('branch-a');
	});

	it('should return error response on exception', async () => {
		const result = await getThoughtHistory(null as any, null as any);

		expect(result.isError).toBe(true);
		expect(result.content[0].text).toContain('error');
	});
});
