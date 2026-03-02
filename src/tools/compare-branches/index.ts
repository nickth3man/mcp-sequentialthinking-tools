import chalk from 'chalk';
import { ThoughtData } from '../sequentialthinking/types.js';
import { BranchStatistics, BranchComparison } from '../branch-explorer/types.js';
import { formatErrorResponse } from '../shared/error.js';
import { CompareBranchesInput } from './types.js';

export async function compareBranches(
	input: CompareBranchesInput,
	context: {
		branches: Record<string, ThoughtData[]>;
	},
): Promise<{
	content: Array<{ type: 'text'; text: string }>;
	isError?: boolean;
}> {
	try {
		if (!input.branch_ids || input.branch_ids.length < 2) {
			return {
				content: [
					{
						type: 'text' as const,
						text: JSON.stringify(
							{
								error: 'at least 2 branch_ids are required for comparison',
								status: 'failed',
							},
							null,
							2,
						),
					},
				],
				isError: true,
			};
		}

		const { branch_ids } = input;
		const { branches } = context;
		const stats: BranchStatistics[] = [];

		for (const branchId of branch_ids) {
			const thoughts = branches[branchId];
			if (!thoughts || thoughts.length === 0) {
				continue;
			}

			const firstThought = thoughts[0];
			const lastThought = thoughts[thoughts.length - 1];
			const revisionCount = thoughts.filter((t) => t.is_revision).length;
			const totalExpected = lastThought.total_thoughts || thoughts.length;
			const completionProgress = firstThought.branch_from_thought
				? thoughts.length
				: lastThought.thought_number;
			const completionPercentage = (completionProgress / totalExpected) * 100;

			const uniqueSteps = new Set(thoughts.map((t) => t.thought_number)).size;
			const depthScore = uniqueSteps > 0 ? thoughts.length / uniqueSteps : 0;

			stats.push({
				branch_id: branchId,
				created_from_thought: firstThought.branch_from_thought || 1,
				total_thoughts: thoughts.length,
				revision_count: revisionCount,
				last_thought_number: lastThought.thought_number,
				completion_percentage: Math.round(completionPercentage),
				depth_score: Math.round(depthScore * 10) / 10,
			});
		}

		if (stats.length === 0) {
			const result: BranchComparison = {
				branches: [],
				recommendation: 'No valid branches found for comparison',
				reasoning: 'The specified branch IDs do not exist or are empty',
			};

			console.error(chalk.cyan('🔀 Compare Branches:'), 'No valid branches found');

			return {
				content: [
					{
						type: 'text' as const,
						text: JSON.stringify(result, null, 2),
					},
				],
			};
		}

		const bestBranch = stats.reduce((best, current) => {
			const currentScore =
				current.completion_percentage + current.depth_score * 10 - current.revision_count * 5;
			const bestScore =
				best.completion_percentage + best.depth_score * 10 - best.revision_count * 5;
			return currentScore > bestScore ? current : best;
		});

		const result: BranchComparison = {
			branches: stats,
			recommendation: `Branch '${bestBranch.branch_id}' appears most promising`,
			best_branch_id: bestBranch.branch_id,
			reasoning: `This branch has the best balance of completion (${bestBranch.completion_percentage}%), depth (${bestBranch.depth_score}), and stability (${bestBranch.revision_count} revisions)`,
		};

		console.error(
			chalk.cyan('🔀 Compare Branches:'),
			`Compared ${stats.length} branches, best: ${bestBranch.branch_id}`,
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
