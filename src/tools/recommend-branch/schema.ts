import { z } from 'zod/v4';

const RECOMMEND_BRANCH_DESCRIPTION = `Recommend the best branch to continue working on.

Analyzes all branches and returns a recommendation based on:
- Completion percentage: Progress toward estimated total thoughts
- Depth score: Average depth of thinking per step  
- Revision count: Number of revisions (penalty)

Score calculation: completion_percentage + (depth_score * 10) - (revision_count * 5)

Returns the best branch with comparison data and reasoning.`;

export const RECOMMEND_BRANCH_INPUT_SCHEMA = z.object({}).describe('No input required - analyzes all branches');

export const RECOMMEND_BRANCH_TOOL = {
	name: 'recommend_branch',
	description: RECOMMEND_BRANCH_DESCRIPTION,
};
