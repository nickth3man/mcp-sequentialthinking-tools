import chalk from 'chalk';
import { ThoughtData } from '../sequentialthinking/types.js';
import { formatErrorResponse } from '../shared/error.js';
import { MergeBranchInsightsInput, MergeBranchInsightsResult } from './types.js';

export async function mergeBranchInsights(
	input: MergeBranchInsightsInput,
	context: {
		branches: Record<string, ThoughtData[]>;
	},
): Promise<MergeBranchInsightsResult> {
	try {
		const branchIds = input.branch_ids || Object.keys(context.branches);

		const allThoughts: ThoughtData[] = [];
		for (const branchId of branchIds) {
			const branchThoughts = context.branches[branchId];
			if (branchThoughts) {
				allThoughts.push(...branchThoughts);
			}
		}

		const insights = allThoughts
			.filter((t) => t.thought && t.thought.trim().length > 10)
			.map((t) => t.thought.trim())
			.filter((value, index, self) => self.indexOf(value) === index)
			.slice(0, 10);

		const synthesis = `Merged insights from ${branchIds.length} branch(es) with ${allThoughts.length} total thoughts. Key themes include ${insights.length > 0 ? 'identified insights' : 'ongoing exploration'}.`;

		const result = { insights, synthesis };

		console.error(
			chalk.cyan('🔀 Merge Branch Insights:'),
			JSON.stringify(result, null, 2),
		);

		return {
			content: [
				{
					type: 'text' as const,
					text: JSON.stringify(result, null, 2),
				},
			],
		};
	} catch (error) {
		return formatErrorResponse(error);
	}
}
