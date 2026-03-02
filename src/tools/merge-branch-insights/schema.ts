import { z } from 'zod/v4';

const MERGE_BRANCH_INSIGHTS_DESCRIPTION = `Merge insights across thought branches.

Collects thought strings from selected branches (or all branches when branch_ids is omitted), filters out short thoughts, deduplicates insights, and returns up to 10 key insights plus a synthesis summary.`;

export const MERGE_BRANCH_INSIGHTS_INPUT_SCHEMA = z.object({
	branch_ids: z
		.array(z.string().min(1).max(256))
		.max(100)
		.optional()
		.describe('Optional list of branch IDs to merge; if omitted all branches are used'),
});

export const MERGE_BRANCH_INSIGHTS_TOOL = {
	name: 'merge_branch_insights',
	description: MERGE_BRANCH_INSIGHTS_DESCRIPTION,
};
