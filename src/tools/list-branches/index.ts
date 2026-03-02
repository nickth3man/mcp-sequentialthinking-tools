import chalk from 'chalk';
import { BranchStatistics } from '../branch-explorer/types.js';
import { ThoughtData } from '../sequentialthinking/types.js';
import { formatErrorResponse } from '../shared/error.js';
import { ListBranchesInput } from './types.js';

function computeBranchStats(branchId: string, thoughts: ThoughtData[]): BranchStatistics {
	const firstThought = thoughts[0];
	const lastThought = thoughts[thoughts.length - 1];
	const revisionCount = thoughts.filter((t) => t.is_revision).length;
	const totalExpected = lastThought.total_thoughts || thoughts.length;
	const completionPercentage = (thoughts.length / totalExpected) * 100;

	const uniqueSteps = new Set(thoughts.map((t) => t.thought_number)).size;
	const depthScore = uniqueSteps > 0 ? thoughts.length / uniqueSteps : 0;

	return {
		branch_id: branchId,
		created_from_thought: firstThought.branch_from_thought || 1,
		total_thoughts: thoughts.length,
		revision_count: revisionCount,
		last_thought_number: lastThought.thought_number,
		completion_percentage: Math.round(completionPercentage),
		depth_score: Math.round(depthScore * 10) / 10,
	};
}

export async function listBranches(
	input: ListBranchesInput,
	context: {
		branches: Record<string, ThoughtData[]>;
	},
): Promise<{
	content: Array<{ type: 'text'; text: string }>;
	isError?: boolean;
}> {
	try {
		const stats: BranchStatistics[] = [];

		for (const [branchId, thoughts] of Object.entries(context.branches)) {
			if (thoughts.length === 0) continue;

			const branchStats = computeBranchStats(branchId, thoughts);

			if (
				input.min_completion_threshold !== undefined &&
				branchStats.completion_percentage < input.min_completion_threshold
			) {
				continue;
			}

			stats.push(branchStats);
		}

		stats.sort((a, b) => b.completion_percentage - a.completion_percentage);

		const result = {
			branches: stats,
			total_branches: Object.keys(context.branches).length,
		};

		console.error(chalk.cyan('📋 List Branches:'), JSON.stringify(result, null, 2));

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
