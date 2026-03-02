import { describe, it, expect, beforeEach } from 'vitest';
import { processBranchExplorer } from './index.js';
import { BranchExplorerInput } from './types.js';
import { ThoughtData } from '../sequentialthinking/types.js';

describe('processBranchExplorer', () => {
	let context: {
		branches: Record<string, ThoughtData[]>;
	};

	beforeEach(() => {
		context = {
			branches: {},
		};
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

	describe('list action', () => {
		it('should return empty list when no branches exist', async () => {
			const input: BranchExplorerInput = { action: 'list' };
			const result = await processBranchExplorer(input, context);

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

			const input: BranchExplorerInput = { action: 'list' };
			const result = await processBranchExplorer(input, context);

			const payload = JSON.parse(result.content[0].text);
			expect(payload.branches).toHaveLength(2);
			expect(payload.total_branches).toBe(2);

			// Check branch-a stats
			const branchA = payload.branches.find((b: any) => b.branch_id === 'branch-a');
			expect(branchA.total_thoughts).toBe(2);
			expect(branchA.completion_percentage).toBe(40); // 2/5 = 40%
			expect(branchA.created_from_thought).toBe(1);
		});

		it('should filter branches by completion threshold', async () => {
			context.branches = {
				'high-completion': [
					createThought({ thought_number: 4, total_thoughts: 5 }),
					createThought({ thought_number: 5, total_thoughts: 5 }),
				],
				'low-completion': [
					createThought({ thought_number: 1, total_thoughts: 10 }),
				],
			};

			const input: BranchExplorerInput = { 
				action: 'list',
				min_completion_threshold: 50 
			};
			const result = await processBranchExplorer(input, context);

			const payload = JSON.parse(result.content[0].text);
			expect(payload.branches).toHaveLength(1);
			expect(payload.branches[0].branch_id).toBe('high-completion');
		});

		it('should calculate depth score correctly', async () => {
			context.branches = {
				'branch-with-revisions': [
					createThought({ thought_number: 2, total_thoughts: 5 }),
					createThought({ thought_number: 2, total_thoughts: 5, is_revision: true }), // revision
					createThought({ thought_number: 3, total_thoughts: 5 }),
				],
			};

			const input: BranchExplorerInput = { action: 'list' };
			const result = await processBranchExplorer(input, context);

			const payload = JSON.parse(result.content[0].text);
			expect(payload.branches[0].revision_count).toBe(1);
			expect(payload.branches[0].depth_score).toBe(1.5); // 3 thoughts / 2 unique steps
		});

		it('should sort branches by completion percentage descending', async () => {
			context.branches = {
				'low': [createThought({ thought_number: 1, total_thoughts: 10 })],
				'high': [createThought({ thought_number: 9, total_thoughts: 10 })],
				'medium': [createThought({ thought_number: 5, total_thoughts: 10 })],
			};

			const input: BranchExplorerInput = { action: 'list' };
			const result = await processBranchExplorer(input, context);

			const payload = JSON.parse(result.content[0].text);
			expect(payload.branches[0].branch_id).toBe('high');
			expect(payload.branches[1].branch_id).toBe('medium');
			expect(payload.branches[2].branch_id).toBe('low');
		});
	});

	describe('compare action', () => {
		it('should require at least 2 branch_ids', async () => {
			const input: BranchExplorerInput = { 
				action: 'compare',
				branch_ids: ['branch-a']
			};
			const result = await processBranchExplorer(input, context);

			expect(result.isError).toBe(true);
			expect(result.content[0].text).toContain('at least 2 branch_ids');
		});

		it('should return error for non-existent branches', async () => {
			const input: BranchExplorerInput = { 
				action: 'compare',
				branch_ids: ['non-existent-1', 'non-existent-2']
			};
			const result = await processBranchExplorer(input, context);

			const payload = JSON.parse(result.content[0].text);
			expect(payload.branches).toEqual([]);
			expect(payload.recommendation).toContain('No valid branches');
		});

		it('should compare multiple branches and recommend best', async () => {
			context.branches = {
				'branch-a': [
					createThought({ thought_number: 3, total_thoughts: 5 }), // 60% complete
				],
				'branch-b': [
					createThought({ thought_number: 2, total_thoughts: 5 }), // 40% complete
				],
			};

			const input: BranchExplorerInput = { 
				action: 'compare',
				branch_ids: ['branch-a', 'branch-b']
			};
			const result = await processBranchExplorer(input, context);

			const payload = JSON.parse(result.content[0].text);
			expect(payload.branches).toHaveLength(2);
			expect(payload.best_branch_id).toBe('branch-a');
			expect(payload.recommendation).toContain('branch-a');
		});
	});

	describe('recommend action', () => {
		it('should return message when no branches exist', async () => {
			const input: BranchExplorerInput = { action: 'recommend' };
			const result = await processBranchExplorer(input, context);

			const payload = JSON.parse(result.content[0].text);
			expect(payload.branches).toEqual([]);
			expect(payload.recommendation).toContain('No branches available');
		});

		it('should return single branch when only one exists', async () => {
			context.branches = {
				'only-branch': [
					createThought({ thought_number: 3, total_thoughts: 5 }),
				],
			};

			const input: BranchExplorerInput = { action: 'recommend' };
			const result = await processBranchExplorer(input, context);

			const payload = JSON.parse(result.content[0].text);
			expect(payload.branches).toHaveLength(1);
			expect(payload.best_branch_id).toBe('only-branch');
			expect(payload.recommendation).toContain('only one branch');
		});

		it('should recommend best branch from multiple options', async () => {
			context.branches = {
				'good-branch': [
					createThought({ thought_number: 4, total_thoughts: 5 }), // 80%
				],
				'poor-branch': [
					createThought({ thought_number: 1, total_thoughts: 5 }), // 20%
				],
			};

			const input: BranchExplorerInput = { action: 'recommend' };
			const result = await processBranchExplorer(input, context);

			const payload = JSON.parse(result.content[0].text);
			expect(payload.best_branch_id).toBe('good-branch');
		});
	});

	describe('merge_insights action', () => {
		it('should merge insights from specified branches', async () => {
			context.branches = {
				'branch-a': [
					createThought({ thought: 'Insight from branch A', thought_number: 1 }),
				],
				'branch-b': [
					createThought({ thought: 'Insight from branch B', thought_number: 1 }),
				],
			};

			const input: BranchExplorerInput = { 
				action: 'merge_insights',
				branch_ids: ['branch-a', 'branch-b']
			};
			const result = await processBranchExplorer(input, context);

			const payload = JSON.parse(result.content[0].text);
			expect(payload.insights).toContain('Insight from branch A');
			expect(payload.insights).toContain('Insight from branch B');
			expect(payload.synthesis).toContain('2 branch');
		});

		it('should merge all branches when branch_ids not specified', async () => {
			context.branches = {
				'branch-a': [createThought({ thought: 'A insight' })],
				'branch-b': [createThought({ thought: 'B insight' })],
			};

			const input: BranchExplorerInput = { action: 'merge_insights' };
			const result = await processBranchExplorer(input, context);

			const payload = JSON.parse(result.content[0].text);
			expect(payload.insights).toHaveLength(2);
		});

		it('should deduplicate insights', async () => {
			context.branches = {
				'branch-a': [createThought({ thought: 'Duplicate insight' })],
				'branch-b': [createThought({ thought: 'Duplicate insight' })],
			};

			const input: BranchExplorerInput = { action: 'merge_insights' };
			const result = await processBranchExplorer(input, context);

			const payload = JSON.parse(result.content[0].text);
			expect(payload.insights).toHaveLength(1);
		});

		it('should limit insights to 10', async () => {
			context.branches = {
				'branch-many': Array.from({ length: 15 }, (_, i) => 
					createThought({ thought: `Insight ${i}`, thought_number: i + 1 })
				),
			};

			const input: BranchExplorerInput = { action: 'merge_insights' };
			const result = await processBranchExplorer(input, context);

			const payload = JSON.parse(result.content[0].text);
			expect(payload.insights.length).toBeLessThanOrEqual(10);
		});

		it('should filter out short thoughts from insights', async () => {
			context.branches = {
				'branch-short': [
					createThought({ thought: 'Short' }), // too short (< 10 chars)
					createThought({ thought: 'This is a longer insight' }), // valid
				],
			};

			const input: BranchExplorerInput = { action: 'merge_insights' };
			const result = await processBranchExplorer(input, context);

			const payload = JSON.parse(result.content[0].text);
			expect(payload.insights).toHaveLength(1);
			expect(payload.insights[0]).toBe('This is a longer insight');
		});
	});

	describe('unknown action', () => {
		it('should return error for unknown action', async () => {
			const input = { action: 'unknown_action' } as any;
			const result = await processBranchExplorer(input, context);

			expect(result.isError).toBe(true);
			expect(result.content[0].text).toContain('Unknown action');
		});
	});
});
