import chalk from 'chalk';
import { BranchComparison, BranchStatistics } from '../branch-explorer/types.js';
import { ThoughtData } from '../sequentialthinking/types.js';
import { formatErrorResponse } from '../shared/error.js';
import { RecommendBranchInput, RecommendBranchResult } from './types.js';

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

function calculateScore(stats: BranchStatistics): number {
	return stats.completion_percentage + stats.depth_score * 10 - stats.revision_count * 5;
}

export async function recommendBranch(
	_input: RecommendBranchInput,
	context: {
		branches: Record<string, ThoughtData[]>;
	},
): Promise<RecommendBranchResult> {
	try {
		const branches: BranchStatistics[] = [];

		for (const [branchId, thoughts] of Object.entries(context.branches)) {
			if (thoughts.length === 0) continue;

			const branchStats = computeBranchStats(branchId, thoughts);
			branches.push(branchStats);
		}

		if (branches.length === 0) {
			const result: BranchComparison = {
				branches: [],
				recommendation: 'No branches available',
				reasoning: 'There are no branches with thoughts to analyze.',
			};

			console.error(chalk.yellow('⚠️ Recommend Branch:'), 'No branches available');

			return {
				content: [
					{
						type: 'text' as const,
						text: JSON.stringify(result, null, 2),
					},
				],
			};
		}

		const scoredBranches = branches.map((b) => ({
			...b,
			score: calculateScore(b),
		}));
		scoredBranches.sort((a, b) => b.score - a.score);

		const bestBranch = scoredBranches[0];
		const comparison: BranchComparison = {
			branches: scoredBranches.map(({ score, ...stats }) => stats),
			recommendation: `Recommended: ${bestBranch.branch_id}`,
			best_branch_id: bestBranch.branch_id,
			reasoning: `Branch '${bestBranch.branch_id}' has the highest score (${bestBranch.score.toFixed(1)}) based on completion (${bestBranch.completion_percentage}%), depth (${bestBranch.depth_score}), and revisions (${bestBranch.revision_count}).`,
		};

		console.error(chalk.cyan('⭐ Recommend Branch:'), JSON.stringify(comparison, null, 2));

		return {
			content: [
				{
					type: 'text' as const,
					text: JSON.stringify(comparison, null, 2),
				},
			],
		};
	} catch (error) {
		return formatErrorResponse(error);
	}
}
