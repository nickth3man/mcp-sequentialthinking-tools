import { z } from 'zod/v4';
import chalk from 'chalk';
import {
	ThoughtData,
	StepRecommendation,
} from '../sequentialthinking/types.js';
import { trimHistory } from '../shared/history.js';
import { ADD_THOUGHT_INPUT_SCHEMA } from './schema.js';
import { formatThought } from '../formatters/thought.js';
import { formatErrorResponse } from '../shared/error.js';
import { sanitizeBranchId } from '../shared/sanitize.js';

type AddThoughtInput = z.infer<typeof ADD_THOUGHT_INPUT_SCHEMA>;

/**
 * Add a thought to the sequential thinking history
 */
export async function addThought(
	input: AddThoughtInput,
	context: {
		thought_history: ThoughtData[];
		branches: Record<string, ThoughtData[]>;
		maxHistorySize: number;
		maxBranchSize: number;
	},
): Promise<{
	content: Array<{ type: 'text'; text: string }>;
	isError?: boolean;
}> {
	try {
		const validatedInput = input;

		if (
			validatedInput.thought_number > validatedInput.total_thoughts
		) {
			validatedInput.total_thoughts = validatedInput.thought_number;
		}

		// Store the current step in thought history
		if (validatedInput.current_step) {
			if (!validatedInput.previous_steps) {
				validatedInput.previous_steps = [];
			}
			validatedInput.previous_steps.push(validatedInput.current_step);
		}

		context.thought_history.push(validatedInput);

		// Prevent memory leaks by limiting history size
		trimHistory(context.thought_history, context.maxHistorySize);
		if (context.thought_history.length > context.maxHistorySize) {
			context.thought_history = context.thought_history.slice(
				-context.maxHistorySize,
			);
			console.error(
				`History trimmed to ${context.maxHistorySize} items`,
			);
		}

		if (
			validatedInput.branch_from_thought &&
			validatedInput.branch_id
		) {
			const branchId = sanitizeBranchId(validatedInput.branch_id);
			if (!context.branches[branchId]) {
				context.branches[branchId] = [];
			}
			const branch = context.branches[branchId];
			if (branch.length >= context.maxBranchSize) {
				throw new Error(`Branch '${branchId}' has reached maximum size (${context.maxBranchSize})`);
			}
			branch.push(validatedInput);
		}

		const formattedThought = formatThought(validatedInput);
		console.error(formattedThought);

		return {
			content: [
				{
					type: 'text' as const,
					text: JSON.stringify(
						{
							thought_number: validatedInput.thought_number,
							total_thoughts: validatedInput.total_thoughts,
							next_thought_needed: validatedInput.next_thought_needed,
							branches: Object.keys(context.branches),
							thought_history_length: context.thought_history.length,
							available_mcp_tools: validatedInput.available_mcp_tools,
							current_step: validatedInput.current_step,
							previous_steps: validatedInput.previous_steps,
							remaining_steps: validatedInput.remaining_steps,
						},
						null,
						2,
					),
				},
			],
		};
	} catch (error) {
		return formatErrorResponse(error);
	}
}
