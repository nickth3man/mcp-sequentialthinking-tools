import chalk from 'chalk';
import { ThoughtData } from '../sequentialthinking/types.js';
import { MergeBranchInsightsInput, MergeBranchInsightsResult } from './types.js';

/**
 * Merge insights across thought branches
 *
 * Collects thought strings from selected branches (or all branches when branch_ids is omitted),
 * filters out short thoughts, deduplicates insights, and returns up to 10 key insights plus a synthesis summary.
 */
export async function mergeBranchInsights(
	input: MergeBranchInsightsInput,
	context: {
		branches: Record<string, ThoughtData[]>;
	}
): Promise<MergeBranchInsightsResult> {
	try {
		// Get branch IDs to process (all branches if not specified)
		const branchIds = input.branch_ids || Object.keys(context.branches);

		// Collect all thoughts from specified branches
		const allThoughts: ThoughtData[] = [];
		for (const branchId of branchIds) {
			const branchThoughts = context.branches[branchId];
			if (branchThoughts) {
				allThoughts.push(...branchThoughts);
			}
		}

		// Extract unique insights from thoughts
		// Filter: thought.length > 10 (after trimming)
		// Deduplicate and limit to 10 insights
		const insights = allThoughts
			.filter((t) => t.thought && t.thought.trim().length > 10)
			.map((t) => t.thought.trim())
			.filter((value, index, self) => self.indexOf(value) === index) // deduplicate
			.slice(0, 10); // limit to 10 insights

		const synthesis = `Merged insights from ${branchIds.length} branch(es) with ${allThoughts.length} total thoughts. Key themes include ${insights.length > 0 ? 'identified insights' : 'ongoing exploration'}.`;

		const result = { insights, synthesis };

		// Log to stderr for visibility
		console.error(chalk.cyan('🔀 Merge Branch Insights:'), JSON.stringify(result, null, 2));

		return {
			content: [
				{
					type: 'text' as const,
					text: JSON.stringify(result, null, 2),
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
