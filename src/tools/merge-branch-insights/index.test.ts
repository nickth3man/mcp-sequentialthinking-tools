import { describe, it, expect, beforeEach } from 'vitest';
import { mergeBranchInsights } from './index.js';
import { ThoughtData } from '../sequentialthinking/types.js';
import { MergeBranchInsightsInput } from './types.js';

describe('mergeBranchInsights', () => {
	let context: {
		branches: Record<string, ThoughtData[]>;
	};

	beforeEach(() => {
		context = {
			branches: {},
		};
	});

	it('should merge insights from specified branches', async () => {
		context.branches = {
			'branch-a': [
				{
					available_mcp_tools: ['tool1'],
					thought: 'This is a thought from branch A with sufficient length',
					thought_number: 1,
					total_thoughts: 2,
					next_thought_needed: true,
					branch_id: 'branch-a',
					branch_from_thought: 1,
				},
			],
			'branch-b': [
				{
					available_mcp_tools: ['tool1'],
					thought: 'This is a thought from branch B with sufficient length',
					thought_number: 1,
					total_thoughts: 2,
					next_thought_needed: true,
					branch_id: 'branch-b',
					branch_from_thought: 1,
				},
			],
		};

		const input: MergeBranchInsightsInput = {
			branch_ids: ['branch-a', 'branch-b'],
		};

		const result = await mergeBranchInsights(input, context);

		expect(result.isError).toBeUndefined();
		expect(result.content).toHaveLength(1);
		expect(result.content[0].type).toBe('text');

		const payload = JSON.parse(result.content[0].text);
		expect(payload.insights).toHaveLength(2);
		expect(payload.insights).toContain('This is a thought from branch A with sufficient length');
		expect(payload.insights).toContain('This is a thought from branch B with sufficient length');
		expect(payload.synthesis).toContain('2 branch(es)');
	});

	it('should merge all branches when branch_ids is not specified', async () => {
		context.branches = {
			'branch-a': [
				{
					available_mcp_tools: ['tool1'],
					thought: 'Thought from branch A with enough characters',
					thought_number: 1,
					total_thoughts: 1,
					next_thought_needed: false,
					branch_id: 'branch-a',
					branch_from_thought: 1,
				},
			],
			'branch-b': [
				{
					available_mcp_tools: ['tool1'],
					thought: 'Thought from branch B with enough characters',
					thought_number: 1,
					total_thoughts: 1,
					next_thought_needed: false,
					branch_id: 'branch-b',
					branch_from_thought: 1,
				},
			],
			'branch-c': [
				{
					available_mcp_tools: ['tool1'],
					thought: 'Thought from branch C with enough characters',
					thought_number: 1,
					total_thoughts: 1,
					next_thought_needed: false,
					branch_id: 'branch-c',
					branch_from_thought: 1,
				},
			],
		};

		const input: MergeBranchInsightsInput = {};

		const result = await mergeBranchInsights(input, context);

		const payload = JSON.parse(result.content[0].text);
		expect(payload.insights).toHaveLength(3);
		expect(payload.synthesis).toContain('3 branch(es)');
	});

	it('should deduplicate insights', async () => {
		context.branches = {
			'branch-a': [
				{
					available_mcp_tools: ['tool1'],
					thought: 'Duplicate thought content here',
					thought_number: 1,
					total_thoughts: 2,
					next_thought_needed: true,
					branch_id: 'branch-a',
					branch_from_thought: 1,
				},
			],
			'branch-b': [
				{
					available_mcp_tools: ['tool1'],
					thought: 'Duplicate thought content here',
					thought_number: 1,
					total_thoughts: 2,
					next_thought_needed: true,
					branch_id: 'branch-b',
					branch_from_thought: 1,
				},
			],
		};

		const input: MergeBranchInsightsInput = {
			branch_ids: ['branch-a', 'branch-b'],
		};

		const result = await mergeBranchInsights(input, context);

		const payload = JSON.parse(result.content[0].text);
		expect(payload.insights).toHaveLength(1);
		expect(payload.insights[0]).toBe('Duplicate thought content here');
	});

	it('should limit insights to 10', async () => {
		const thoughts: ThoughtData[] = [];
		for (let i = 1; i <= 15; i++) {
			thoughts.push({
				available_mcp_tools: ['tool1'],
				thought: `This is thought number ${i} with enough length to pass filter`,
				thought_number: i,
				total_thoughts: 15,
				next_thought_needed: true,
				branch_id: 'branch-a',
				branch_from_thought: 1,
			});
		}

		context.branches = {
			'branch-a': thoughts,
		};

		const input: MergeBranchInsightsInput = {
			branch_ids: ['branch-a'],
		};

		const result = await mergeBranchInsights(input, context);

		const payload = JSON.parse(result.content[0].text);
		expect(payload.insights).toHaveLength(10);
	});

	it('should filter out short thoughts (less than 10 characters)', async () => {
		context.branches = {
			'branch-a': [
				{
					available_mcp_tools: ['tool1'],
					thought: 'Short',
					thought_number: 1,
					total_thoughts: 3,
					next_thought_needed: true,
					branch_id: 'branch-a',
					branch_from_thought: 1,
				},
				{
					available_mcp_tools: ['tool1'],
					thought: 'This is a much longer thought that should be included',
					thought_number: 2,
					total_thoughts: 3,
					next_thought_needed: true,
					branch_id: 'branch-a',
					branch_from_thought: 1,
				},
				{
					available_mcp_tools: ['tool1'],
					thought: 'Tiny',
					thought_number: 3,
					total_thoughts: 3,
					next_thought_needed: false,
					branch_id: 'branch-a',
					branch_from_thought: 1,
				},
			],
		};

		const input: MergeBranchInsightsInput = {
			branch_ids: ['branch-a'],
		};

		const result = await mergeBranchInsights(input, context);

		const payload = JSON.parse(result.content[0].text);
		expect(payload.insights).toHaveLength(1);
		expect(payload.insights[0]).toBe('This is a much longer thought that should be included');
	});

	it('should return empty insights when no branches exist', async () => {
		const input: MergeBranchInsightsInput = {};

		const result = await mergeBranchInsights(input, context);

		const payload = JSON.parse(result.content[0].text);
		expect(payload.insights).toHaveLength(0);
		expect(payload.synthesis).toContain('0 branch(es)');
	});

	it('should return empty insights when specified branches do not exist', async () => {
		context.branches = {
			'branch-a': [
				{
					available_mcp_tools: ['tool1'],
					thought: 'This is a valid thought with sufficient length',
					thought_number: 1,
					total_thoughts: 1,
					next_thought_needed: false,
					branch_id: 'branch-a',
					branch_from_thought: 1,
				},
			],
		};

		const input: MergeBranchInsightsInput = {
			branch_ids: ['non-existent-branch'],
		};

		const result = await mergeBranchInsights(input, context);

		const payload = JSON.parse(result.content[0].text);
		expect(payload.insights).toHaveLength(0);
		expect(payload.synthesis).toContain('1 branch(es)');
	});

	it('should handle branches with empty thought arrays', async () => {
		context.branches = {
			'branch-a': [],
			'branch-b': [
				{
					available_mcp_tools: ['tool1'],
					thought: 'Valid thought from branch B with enough length',
					thought_number: 1,
					total_thoughts: 1,
					next_thought_needed: false,
					branch_id: 'branch-b',
					branch_from_thought: 1,
				},
			],
		};

		const input: MergeBranchInsightsInput = {};

		const result = await mergeBranchInsights(input, context);

		const payload = JSON.parse(result.content[0].text);
		expect(payload.insights).toHaveLength(1);
		expect(payload.insights[0]).toBe('Valid thought from branch B with enough length');
	});

	it('should trim whitespace when filtering short thoughts', async () => {
		context.branches = {
			'branch-a': [
				{
					available_mcp_tools: ['tool1'],
					thought: '   Short   ',
					thought_number: 1,
					total_thoughts: 2,
					next_thought_needed: true,
					branch_id: 'branch-a',
					branch_from_thought: 1,
				},
				{
					available_mcp_tools: ['tool1'],
					thought: 'This is a valid thought with sufficient length',
					thought_number: 2,
					total_thoughts: 2,
					next_thought_needed: false,
					branch_id: 'branch-a',
					branch_from_thought: 1,
				},
			],
		};

		const input: MergeBranchInsightsInput = {
			branch_ids: ['branch-a'],
		};

		const result = await mergeBranchInsights(input, context);

		const payload = JSON.parse(result.content[0].text);
		expect(payload.insights).toHaveLength(1);
		expect(payload.insights[0]).toBe('This is a valid thought with sufficient length');
	});
});
