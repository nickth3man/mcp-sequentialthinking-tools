import { z } from 'zod/v4';
import chalk from 'chalk';
import {
	ThoughtData,
	StepRecommendation,
} from './types.js';
import { SEQUENTIAL_THINKING_INPUT_SCHEMA } from './schema.js';

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
	}
): Promise<{
	content: Array<{ type: 'text'; text: string }>;
	isError?: boolean;
}> {
	try {
		const validatedInput = input as ThoughtData;

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
	if (context.thought_history.length > context.maxHistorySize) {
		context.thought_history = context.thought_history.slice(-context.maxHistorySize);
		console.error(`History trimmed to ${context.maxHistorySize} items`);
	}

		if (
			validatedInput.branch_from_thought &&
			validatedInput.branch_id
		) {
			if (!context.branches[validatedInput.branch_id]) {
				context.branches[validatedInput.branch_id] = [];
			}
			context.branches[validatedInput.branch_id].push(validatedInput);
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
							next_thought_needed:
								validatedInput.next_thought_needed,
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
		return {
			content: [
				{
					type: 'text' as const,
					text: JSON.stringify(
						{
							error:
								error instanceof Error
									? error.message
									: String(error),
							status: 'failed',
						},
						null,
						2,
					),
				},
			],
			isError: true,
		};
	}
}

/**
 * Format a step recommendation for display
 */
function formatRecommendation(step: StepRecommendation): string {
	const tools = step.recommended_tools
		.map((tool) => {
			const alternatives = tool.alternatives?.length 
				? ` (alternatives: ${tool.alternatives.join(', ')})`
				: '';
			const inputs = tool.suggested_inputs 
				? `\n    Suggested inputs: ${JSON.stringify(tool.suggested_inputs)}`
				: '';
			return `  - ${tool.tool_name} (priority: ${tool.priority})${alternatives}\n    Rationale: ${tool.rationale}${inputs}`;
		})
		.join('\n');

	return `Step: ${step.step_description}
Recommended Tools:
${tools}
Expected Outcome: ${step.expected_outcome}${
		step.next_step_conditions
			? `\nConditions for next step:\n  - ${step.next_step_conditions.join('\n  - ')}`
			: ''
	}`;
}

/**
 * Format a thought for display
 */
function formatThought(thoughtData: ThoughtData): string {
	const {
		thought_number,
		total_thoughts,
		thought,
		is_revision,
		revises_thought,
		branch_from_thought,
		branch_id,
		current_step,
	} = thoughtData;

	let prefix = '';
	let context = '';

	if (is_revision) {
		prefix = chalk.yellow('🔄 Revision');
		context = ` (revising thought ${revises_thought})`;
	} else if (branch_from_thought) {
		prefix = chalk.green('🌿 Branch');
		context = ` (from thought ${branch_from_thought}, ID: ${branch_id})`;
	} else {
		prefix = chalk.blue('💭 Thought');
		context = '';
	}

	const header = `${prefix} ${thought_number}/${total_thoughts}${context}`;
	let content = thought;

	// Add recommendation information if present
	if (current_step) {
		content = `${thought}\n\nRecommendation:\n${formatRecommendation(current_step)}`;
	}

	const border = '─'.repeat(
		Math.max(header.length, content.length) + 4,
	);

	return `
┌${border}┐
│ ${header} │
├${border}┤
│ ${content.padEnd(border.length - 2)} │
└${border}┘`;
}
