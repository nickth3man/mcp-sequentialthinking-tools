import chalk from 'chalk';
import {
	BranchStatistics,
	BranchComparison,
	BranchExplorerInput,
} from './types.js';
import { ThoughtData } from '../sequentialthinking/types.js';
import { formatErrorResponse } from '../shared/error.js';

export async function processBranchExplorer(
	input: BranchExplorerInput,
	context: {
		branches: Record<string, ThoughtData[]>;
	},
): Promise<{
	content: Array<{ type: 'text'; text: string }>;
	isError?: boolean;
}> {
	try {
		let result: unknown;

		switch (input.action) {
			case 'list':
				result = {
					branches: listBranches(context.branches, input.min_completion_threshold),
					total_branches: Object.keys(context.branches).length,
				};
				break;
			case 'compare':
				if (!input.branch_ids || input.branch_ids.length < 2) {
					throw new Error('Compare action requires at least 2 branch_ids');
				}
				result = compareBranches(context.branches, input.branch_ids);
				break;
			case 'recommend':
				result = recommendBranch(context.branches);
				break;
			case 'merge_insights':
				result = mergeInsights(context.branches, input.branch_ids);
				break;
			default:
				throw new Error(`Unknown action: ${input.action}`);
		}

		console.error(
			chalk.cyan(`🔀 Branch Explorer (${input.action}):`),
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

function listBranches(
	branches: Record<string, ThoughtData[]>,
	minCompletionThreshold?: number,
): BranchStatistics[] {
	const stats: BranchStatistics[] = [];

	for (const [branchId, thoughts] of Object.entries(branches)) {
		if (thoughts.length === 0) continue;

		const firstThought = thoughts[0];
		const lastThought = thoughts[thoughts.length - 1];
		const revisionCount = thoughts.filter((t) => t.is_revision).length;
		const totalExpected = lastThought.total_thoughts || thoughts.length;
		const completionProgress = firstThought.branch_from_thought
			? thoughts.length
			: lastThought.thought_number;
		const completionPercentage = (completionProgress / totalExpected) * 100;

		if (
			minCompletionThreshold !== undefined &&
			completionPercentage < minCompletionThreshold
		) {
			continue;
		}

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

	return stats.sort((a, b) => b.completion_percentage - a.completion_percentage);
}

function compareBranches(
	branches: Record<string, ThoughtData[]>,
	branchIds: string[],
): BranchComparison {
	const branchThoughts = branchIds
		.map((id) => branches[id])
		.filter((thoughts) => thoughts && thoughts.length > 0);

	if (branchThoughts.length === 0) {
		return {
			branches: [],
			recommendation: 'No valid branches found for comparison',
			reasoning: 'The specified branch IDs do not exist or are empty',
		};
	}

	const stats = listBranches(branches).filter((stat) =>
		branchIds.includes(stat.branch_id),
	);
	const bestBranch = stats.reduce((best, current) => {
		const currentScore =
			current.completion_percentage + current.depth_score * 10 - current.revision_count * 5;
		const bestScore =
			best.completion_percentage + best.depth_score * 10 - best.revision_count * 5;
		return currentScore > bestScore ? current : best;
	});

	return {
		branches: stats,
		recommendation: `Branch '${bestBranch.branch_id}' appears most promising`,
		best_branch_id: bestBranch.branch_id,
		reasoning: `This branch has the best balance of completion (${bestBranch.completion_percentage}%), depth (${bestBranch.depth_score}), and stability (${bestBranch.revision_count} revisions)`,
	};
}

function recommendBranch(branches: Record<string, ThoughtData[]>): BranchComparison {
	const allStats = listBranches(branches);

	if (allStats.length === 0) {
		return {
			branches: [],
			recommendation: 'No branches available',
			reasoning:
				'Create branches first using branch_from_thought in your thinking process',
		};
	}

	if (allStats.length === 1) {
		const only = allStats[0];
		return {
			branches: allStats,
			recommendation: `only one branch available: '${only.branch_id}'`,
			best_branch_id: only.branch_id,
			reasoning: `This branch is at ${only.completion_percentage}% completion with ${only.total_thoughts} thoughts`,
		};
	}

	return compareBranches(branches, allStats.map((s) => s.branch_id));
}

function mergeInsights(
	branches: Record<string, ThoughtData[]>,
	branchIds?: string[],
): { insights: string[]; synthesis: string } {
	const ids = branchIds || Object.keys(branches);
	const allThoughts: ThoughtData[] = [];

	for (const id of ids) {
		const branchThoughts = branches[id];
		if (branchThoughts) {
			allThoughts.push(...branchThoughts);
		}
	}

	const insights = allThoughts
		.filter((t) => t.thought && t.thought.trim().length > 5)
		.map((t) => t.thought)
		.filter((value, index, self) => self.indexOf(value) === index)
		.slice(0, 10);

	const synthesis = `Merged insights from ${ids.length} branch(es) with ${allThoughts.length} total thoughts. Key themes include ${insights.length > 0 ? 'identified insights' : 'ongoing exploration'}.`;

	return { insights, synthesis };
}
