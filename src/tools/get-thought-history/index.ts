import { z } from 'zod/v4';
import { ThoughtData } from '../sequentialthinking/types.js';
import { GET_THOUGHT_HISTORY_INPUT_SCHEMA } from './schema.js';

type GetThoughtHistoryInput = z.infer<typeof GET_THOUGHT_HISTORY_INPUT_SCHEMA>;

/**
 * Get thought history with filtering and pagination
 */
export async function getThoughtHistory(
	input: GetThoughtHistoryInput,
	context: {
		thought_history: ThoughtData[];
	}
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

		// Start with all thoughts
		let filtered = [...context.thought_history];

		// Filter by branch_id if specified
		if (branch_id !== undefined) {
			filtered = filtered.filter(t => t.branch_id === branch_id);
		}

		// Filter out revisions if requested
		if (!include_revisions) {
			filtered = filtered.filter(t => !t.is_revision);
		}

		// Calculate total count before pagination
		const total_count = filtered.length;

		// Reverse if requested
		if (reverse) {
			filtered = filtered.reverse();
		}

		// Apply pagination
		const paginated = filtered.slice(offset, limit ? offset + limit : undefined);

		// Build summary statistics
		const allThoughts = context.thought_history;
		const branches = [...new Set(allThoughts.map(t => t.branch_id).filter(Boolean))];
		const revision_count = allThoughts.filter(t => t.is_revision).length;

		// Prepare thoughts for output (optionally exclude branch info)
		const thoughts = paginated.map(t => {
			if (include_branch_info) {
				return t;
			}
			// Exclude branch metadata
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
						2
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
							error: error instanceof Error ? error.message : String(error),
							status: 'failed',
						},
						null,
						2
					),
				},
			],
			isError: true,
		};
	}
}
