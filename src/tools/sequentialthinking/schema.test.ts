import { describe, it, expect } from 'vitest';
import { BRANCH_EXPLORER_INPUT_SCHEMA } from '../branch-explorer/schema.js';
import {
	SEQUENTIAL_THINKING_INPUT_SCHEMA,
	StepRecommendationZodSchema,
	ToolRecommendationZodSchema,
} from './schema.js';

describe('SEQUENTIAL_THINKING_INPUT_SCHEMA', () => {
	it('should accept valid minimal payload', () => {
		const result = SEQUENTIAL_THINKING_INPUT_SCHEMA.safeParse({
			available_mcp_tools: ['tool1'],
			thought: 'Test thought',
			next_thought_needed: true,
			thought_number: 1,
			total_thoughts: 1,
		});

		expect(result.success).toBe(true);
	});

	it('should accept payload with current_step', () => {
		const result = SEQUENTIAL_THINKING_INPUT_SCHEMA.safeParse({
			available_mcp_tools: ['search_docs'],
			thought: 'Research step',
			next_thought_needed: true,
			thought_number: 1,
			total_thoughts: 3,
			current_step: {
				step_description: 'Search documentation',
				expected_outcome: 'Find relevant docs',
				recommended_tools: [
					{
						tool_name: 'search_docs',
						confidence: 0.9,
						rationale: 'Official documentation',
						priority: 1,
					},
				],
			},
		});

		expect(result.success).toBe(true);
	});

	it('should reject negative thought_number', () => {
		const result = SEQUENTIAL_THINKING_INPUT_SCHEMA.safeParse({
			available_mcp_tools: ['tool1'],
			thought: 'Test',
			next_thought_needed: true,
			thought_number: -1,
			total_thoughts: 1,
		});

		expect(result.success).toBe(false);
	});

	it('should reject zero total_thoughts', () => {
		const result = SEQUENTIAL_THINKING_INPUT_SCHEMA.safeParse({
			available_mcp_tools: ['tool1'],
			thought: 'Test',
			next_thought_needed: true,
			thought_number: 1,
			total_thoughts: 0,
		});

		expect(result.success).toBe(false);
	});

	it('should accept revision fields', () => {
		const result = SEQUENTIAL_THINKING_INPUT_SCHEMA.safeParse({
			available_mcp_tools: ['tool1'],
			thought: 'Revised thought',
			next_thought_needed: true,
			thought_number: 2,
			total_thoughts: 3,
			is_revision: true,
			revises_thought: 1,
		});

		expect(result.success).toBe(true);
	});

	it('should accept branch fields', () => {
		const result = SEQUENTIAL_THINKING_INPUT_SCHEMA.safeParse({
			available_mcp_tools: ['tool1'],
			thought: 'Branch thought',
			next_thought_needed: true,
			thought_number: 2,
			total_thoughts: 5,
			branch_from_thought: 1,
			branch_id: 'branch-a',
		});

		expect(result.success).toBe(true);
	});

	it('should accept previous_steps array', () => {
		const result = SEQUENTIAL_THINKING_INPUT_SCHEMA.safeParse({
			available_mcp_tools: ['tool1'],
			thought: 'Step 2',
			next_thought_needed: true,
			thought_number: 2,
			total_thoughts: 3,
			previous_steps: [
				{
					step_description: 'Step 1',
					expected_outcome: 'Completed step 1',
					recommended_tools: [],
				},
			],
		});

		expect(result.success).toBe(true);
	});
});

describe('ToolRecommendationZodSchema', () => {
	it('should accept valid tool recommendation', () => {
		const result = ToolRecommendationZodSchema.safeParse({
			tool_name: 'search_docs',
			confidence: 0.85,
			rationale: 'Good for documentation',
			priority: 1,
		});

		expect(result.success).toBe(true);
	});

	it('should reject confidence > 1', () => {
		const result = ToolRecommendationZodSchema.safeParse({
			tool_name: 'tool1',
			confidence: 1.5,
			rationale: 'Test',
			priority: 1,
		});

		expect(result.success).toBe(false);
	});

	it('should reject negative confidence', () => {
		const result = ToolRecommendationZodSchema.safeParse({
			tool_name: 'tool1',
			confidence: -0.5,
			rationale: 'Test',
			priority: 1,
		});

		expect(result.success).toBe(false);
	});

	it('should accept with optional fields', () => {
		const result = ToolRecommendationZodSchema.safeParse({
			tool_name: 'tool1',
			confidence: 0.8,
			rationale: 'Test rationale',
			priority: 2,
			suggested_inputs: { query: 'test' },
			alternatives: ['alt1', 'alt2'],
		});

		expect(result.success).toBe(true);
	});
});

describe('StepRecommendationZodSchema', () => {
	it('should accept valid step recommendation', () => {
		const result = StepRecommendationZodSchema.safeParse({
			step_description: 'Research the API',
			expected_outcome: 'Understand endpoints',
			recommended_tools: [
				{
					tool_name: 'search_docs',
					confidence: 0.9,
					rationale: 'Find API docs',
					priority: 1,
				},
			],
		});

		expect(result.success).toBe(true);
	});

	it('should accept with next_step_conditions', () => {
		const result = StepRecommendationZodSchema.safeParse({
			step_description: 'Analyze data',
			expected_outcome: 'Insights gained',
			recommended_tools: [],
			next_step_conditions: ['Data is clean', 'Analysis is complete'],
		});

		expect(result.success).toBe(true);
	});
});

describe('BRANCH_EXPLORER_INPUT_SCHEMA', () => {
	it('should accept list action', () => {
		const result = BRANCH_EXPLORER_INPUT_SCHEMA.safeParse({
			action: 'list',
		});

		expect(result.success).toBe(true);
	});

	it('should accept list with min_completion_threshold', () => {
		const result = BRANCH_EXPLORER_INPUT_SCHEMA.safeParse({
			action: 'list',
			min_completion_threshold: 50,
		});

		expect(result.success).toBe(true);
	});

	it('should reject threshold > 100', () => {
		const result = BRANCH_EXPLORER_INPUT_SCHEMA.safeParse({
			action: 'list',
			min_completion_threshold: 150,
		});

		expect(result.success).toBe(false);
	});

	it('should accept compare action with branch_ids', () => {
		const result = BRANCH_EXPLORER_INPUT_SCHEMA.safeParse({
			action: 'compare',
			branch_ids: ['branch-a', 'branch-b'],
		});

		expect(result.success).toBe(true);
	});

	it('should accept recommend action', () => {
		const result = BRANCH_EXPLORER_INPUT_SCHEMA.safeParse({
			action: 'recommend',
		});

		expect(result.success).toBe(true);
	});

	it('should accept merge_insights action', () => {
		const result = BRANCH_EXPLORER_INPUT_SCHEMA.safeParse({
			action: 'merge_insights',
			branch_ids: ['branch-a', 'branch-b'],
		});

		expect(result.success).toBe(true);
	});

	it('should reject invalid action', () => {
		const result = BRANCH_EXPLORER_INPUT_SCHEMA.safeParse({
			action: 'invalid_action',
		});

		expect(result.success).toBe(false);
	});
});
