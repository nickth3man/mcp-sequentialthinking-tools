import { z } from 'zod/v4';

const LIST_BRANCHES_DESCRIPTION = `List all thought branches with statistics.

Returns branch statistics including thought count, revision count, completion percentage, and depth score. Optionally filter by minimum completion threshold.

Metrics provided:
- Total thoughts: Number of thoughts in the branch
- Revision count: How many times thoughts were revised
- Completion percentage: Progress toward estimated total thoughts
- Depth score: Average depth of thinking per step
- Created from: Which thought number the branch originated from`;

export const LIST_BRANCHES_INPUT_SCHEMA = z.object({
	min_completion_threshold: z.number().min(0).max(100).optional().describe('Minimum completion percentage to include (0-100)'),
});

export const LIST_BRANCHES_TOOL = {
	name: 'list_branches',
	description: LIST_BRANCHES_DESCRIPTION,
};
