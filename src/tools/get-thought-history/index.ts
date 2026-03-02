import { z } from 'zod/v4';
import { ThoughtData } from '../sequentialthinking/types.js';
import { formatErrorResponse } from '../shared/error.js';
import { GET_THOUGHT_HISTORY_INPUT_SCHEMA } from './schema.js';

type GetThoughtHistoryInput = z.infer<typeof GET_THOUGHT_HISTORY_INPUT_SCHEMA>;

export async function getThoughtHistory(
	input: GetThoughtHistoryInput,
	context: {
		thought_history: ThoughtData[];
	},
): Promise<{
	content: Array<{ type: 'text'; text: string }>;
	isError?: boolean;
}> {
	try {
		const {
			limit,
			offset = 0,
			branch_id,
			include_revisions = true,
			include_branch_info = true,
			reverse = false,
		} = input || {};

		let filtered = [...context.thought_history];

		if (branch_id !== undefined) {
			filtered = filtered.filter((t) => t.branch_id === branch_id);
		}

		if (!include_revisions) {
			filtered = filtered.filter((t) => !t.is_revision);
		}

		const total_count = filtered.length;

		if (reverse) {
			filtered = filtered.reverse();
		}

		const paginated = filtered.slice(offset, limit ? offset + limit : undefined);

		const allThoughts = context.thought_history;
		const branches = [...new Set(allThoughts.map((t) => t.branch_id).filter(Boolean))];
		const revision_count = allThoughts.filter((t) => t.is_revision).length;

		const thoughts = paginated.map((t) => {
			if (include_branch_info) {
				return t;
			}
			const { branch_id, branch_from_thought, ...rest } = t;
			return rest;
		});

		return {
			content: [
				{
					type: 'text' as const,
					text: JSON.stringify(
						{
							thoughts,
							total_count,
							offset,
							limit: limit || total_count,
							summary: {
								total_thoughts: allThoughts.length,
								revision_count,
								branches,
								branch_count: branches.length,
							},
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
