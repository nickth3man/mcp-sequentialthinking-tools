import { z } from 'zod/v4';

// Branch Explorer Tool Description
const BRANCH_EXPLORER_DESCRIPTION = `A tool for exploring and analyzing thought branches in the sequential thinking process.

This tool helps you understand the landscape of your thinking by analyzing different branches, comparing their progress, and providing recommendations on which path to pursue.

When to use this tool:
- You have created multiple branches and need to decide which to focus on
- You want to compare progress across different approaches
- You need to identify the most promising branch based on metrics
- You want to merge insights from multiple branches
- You're unsure which thought path has made the most progress

Actions:
- list: Shows all branches with statistics (thought count, revisions, completion %)
- compare: Compares specific branches side-by-side with detailed metrics
- recommend: Analyzes all branches and recommends the best one to pursue
- merge_insights: Extracts key insights from multiple branches for synthesis

Metrics provided:
- Total thoughts: Number of thoughts in the branch
- Revision count: How many times thoughts were revised
- Completion percentage: Progress toward estimated total thoughts
- Depth score: Average depth of thinking per step
- Created from: Which thought number the branch originated from`;

export const BRANCH_EXPLORER_INPUT_SCHEMA = z.object({
	action: z.union([
		z.literal('list'),
		z.literal('compare'),
		z.literal('recommend'),
		z.literal('merge_insights'),
	]).describe('The action to perform: list, compare, recommend, or merge_insights'),
	branch_ids: z.array(z.string()).optional().describe('Specific branch IDs to compare (for compare action)'),
	min_completion_threshold: z.number().min(0).max(100).optional().describe('Minimum completion percentage to include (0-100)'),
});

export const BRANCH_EXPLORER_TOOL = {
	name: 'branch_explorer',
	description: BRANCH_EXPLORER_DESCRIPTION,
};
