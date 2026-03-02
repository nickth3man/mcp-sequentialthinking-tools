import { z } from 'zod/v4';
import { ThoughtData } from './types.js';
import { SEQUENTIAL_THINKING_INPUT_SCHEMA } from './schema.js';
import { formatThought } from '../formatters/thought.js';
import { trimHistory } from '../shared/history.js';
import { formatErrorResponse } from '../shared/error.js';

type SequentialThinkingInput = z.infer<typeof SEQUENTIAL_THINKING_INPUT_SCHEMA>;

/**
 * Process a sequential thinking thought
 */
export async function processThought(
	input: SequentialThinkingInput,
	context: {
		thought_history: ThoughtData[];
		branches: Record<string, ThoughtData[]>;
		maxHistorySize: number;
	},
): Promise<{
	content: Array<{ type: 'text'; text: string }>;
	isError?: boolean;
}> {
	try {
		if (input.thought_number > input.total_thoughts) {
			input.total_thoughts = input.thought_number;
		}

		if (input.current_step) {
			if (!input.previous_steps) {
				input.previous_steps = [];
			}
			input.previous_steps.push(input.current_step);
		}

		context.thought_history.push(input);
		const previousLength = context.thought_history.length;
		trimHistory(context.thought_history, context.maxHistorySize);
		if (previousLength > context.maxHistorySize) {
			console.error(`History trimmed to ${context.maxHistorySize} items`);
		}

		if (input.branch_from_thought && input.branch_id) {
			if (!context.branches[input.branch_id]) {
				context.branches[input.branch_id] = [];
			}
			context.branches[input.branch_id].push(input);
		}

		const formattedThought = formatThought(input);
		console.error(formattedThought);

		return {
			content: [
				{
					type: 'text' as const,
					text: JSON.stringify(
						{
							thought_number: input.thought_number,
							total_thoughts: input.total_thoughts,
							next_thought_needed: input.next_thought_needed,
							branches: Object.keys(context.branches),
							thought_history_length: context.thought_history.length,
							available_mcp_tools: input.available_mcp_tools,
							current_step: input.current_step,
							previous_steps: input.previous_steps,
							remaining_steps: input.remaining_steps,
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
