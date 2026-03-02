import { z } from 'zod/v4';
import { ThoughtData } from '../sequentialthinking/types.js';
import { formatErrorResponse } from '../shared/error.js';
import { CREATE_BRANCH_INPUT_SCHEMA } from './schema.js';

type CreateBranchInput = z.infer<typeof CREATE_BRANCH_INPUT_SCHEMA>;

export async function createBranch(
	input: CreateBranchInput,
	context: {
		thought_history: ThoughtData[];
		branches: Record<string, ThoughtData[]>;
	},
): Promise<{
	content: Array<{ type: 'text'; text: string }>;
	isError?: boolean;
}> {
	try {
		const sourceThought = context.thought_history.find(
			(t) => t.thought_number === input.thought_number,
		);

		if (!sourceThought) {
			throw new Error(`Thought number ${input.thought_number} not found in history`);
		}

		if (context.branches[input.branch_id] !== undefined) {
			throw new Error(`Branch '${input.branch_id}' already exists`);
		}

		context.branches[input.branch_id] = [];

		if (input.thought) {
			const branchThought: ThoughtData = {
				available_mcp_tools: sourceThought.available_mcp_tools,
				thought: input.thought,
				thought_number: input.thought_number + 1,
				total_thoughts: sourceThought.total_thoughts,
				next_thought_needed: true,
				branch_from_thought: input.thought_number,
				branch_id: input.branch_id,
			};
			context.branches[input.branch_id].push(branchThought);
		}

		return {
			content: [
				{
					type: 'text' as const,
					text: JSON.stringify(
						{
							status: 'created',
							branch_id: input.branch_id,
							branched_from_thought: input.thought_number,
							source_thought: sourceThought.thought,
							branch_thought_count: context.branches[input.branch_id].length,
							existing_branches: Object.keys(context.branches),
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
