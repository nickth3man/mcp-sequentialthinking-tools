import { z } from 'zod/v4';

// Compare Branches Tool Description
const COMPARE_BRANCHES_DESCRIPTION = `A tool for comparing multiple thought branches side-by-side.

This tool analyzes and compares different branches from the sequential thinking process, providing detailed statistics and recommendations on which branch is most promising to pursue.

When to use this tool:
- You have created multiple branches and need to decide which to focus on
- You want to compare progress across different approaches
- You need to identify the most promising branch based on metrics
- You're unsure which thought path has made the most progress

Input: Array of branch IDs (at least 2 required)

Metrics provided for each branch:
- Total thoughts: Number of thoughts in the branch
- Revision count: How many times thoughts were revised
- Completion percentage: Progress toward estimated total thoughts
- Depth score: Average depth of thinking per step
- Created from: Which thought number the branch originated from

Returns:
- Statistics for each compared branch
- Recommendation on the best branch to pursue
- Reasoning explaining the recommendation`;

export const COMPARE_BRANCHES_INPUT_SCHEMA = z.object({
	branch_ids: z.array(z.string().max(256)).min(2, 'At least 2 branch_ids are required for comparison').max(100),
});

export const COMPARE_BRANCHES_TOOL = {
	name: 'compare_branches',
	description: COMPARE_BRANCHES_DESCRIPTION,
};
