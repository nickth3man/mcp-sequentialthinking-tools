import { z } from 'zod/v4';

// Add Thought Tool Description
const ADD_THOUGHT_DESCRIPTION = `A focused tool for adding a single thought to the sequential thinking process.

This tool adds one thought to the thinking history, handling history management, branching, and validation. It's designed for atomic thought operations rather than complex multi-step workflows.

When to use this tool:
- You want to record a single thinking step
- You need to add a thought to an existing branch
- You're building a custom thinking workflow and need fine-grained control
- You want to add thoughts without the full sequentialthinking_tools overhead

Features:
- Automatic history management with configurable size limits
- Support for branching thoughts
- Revision tracking
- Step recommendation storage

The tool returns the current state including thought_number, total_thoughts, branches, and history length.`;

export const ADD_THOUGHT_INPUT_SCHEMA = z.object({
	available_mcp_tools: z.array(z.string()).describe('Array of MCP tool names available for use'),
	thought: z.string().describe('The thought content to add'),
	thought_number: z.number().int().min(1).describe('Current thought number in the sequence'),
	total_thoughts: z.number().int().min(1).describe('Estimated total thoughts needed'),
	next_thought_needed: z.boolean().describe('Whether another thought step is needed'),
	is_revision: z.boolean().optional().describe('Whether this revises previous thinking'),
	revises_thought: z.number().int().min(1).optional().describe('Which thought is being reconsidered'),
	branch_from_thought: z.number().int().min(1).optional().describe('Branching point thought number'),
	branch_id: z.string().optional().describe('Branch identifier'),
	needs_more_thoughts: z.boolean().optional().describe('If more thoughts are needed'),
	current_step: z.object({
		step_description: z.string().describe('What needs to be done'),
		recommended_tools: z.array(z.object({
			tool_name: z.string(),
			confidence: z.number().min(0).max(1),
			rationale: z.string(),
			priority: z.number(),
			suggested_inputs: z.record(z.string(), z.unknown()).optional(),
			alternatives: z.array(z.string()).optional(),
		})),
		expected_outcome: z.string(),
		next_step_conditions: z.array(z.string()).optional(),
	}).optional().describe('Current step recommendation'),
	previous_steps: z.array(z.object({
		step_description: z.string(),
		recommended_tools: z.array(z.object({
			tool_name: z.string(),
			confidence: z.number().min(0).max(1),
			rationale: z.string(),
			priority: z.number(),
			suggested_inputs: z.record(z.string(), z.unknown()).optional(),
			alternatives: z.array(z.string()).optional(),
		})),
		expected_outcome: z.string(),
		next_step_conditions: z.array(z.string()).optional(),
	})).optional().describe('Steps already recommended'),
	remaining_steps: z.array(z.string()).optional().describe('High-level descriptions of upcoming steps'),
});

export const ADD_THOUGHT_TOOL = {
	name: 'add_thought',
	description: ADD_THOUGHT_DESCRIPTION,
};
