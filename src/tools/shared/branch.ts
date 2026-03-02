/**
 * Shared branch management utilities
 */
import type { ThoughtData } from '../sequentialthinking/types.js';
import type { BranchStatistics } from '../branch-explorer/types.js';

/**
 * Add a thought to the appropriate branch.
 * Only adds if both branch_id and branch_from_thought are present.
 * Mutates the branches record in place.
 */
export function addToBranch(
	thought: ThoughtData,
	branches: Record<string, ThoughtData[]>,
): void {
	if (!thought.branch_id || !thought.branch_from_thought) {
		return;
	}

	if (!branches[thought.branch_id]) {
		branches[thought.branch_id] = [];
	}

	branches[thought.branch_id].push(thought);
}

/**
 * Get statistics for all non-empty branches, sorted by completion_percentage descending.
 */
export function getBranchStats(
	branches: Record<string, ThoughtData[]>,
): BranchStatistics[] {
	const stats: BranchStatistics[] = [];

	for (const [branchId, thoughts] of Object.entries(branches)) {
		if (thoughts.length === 0) continue;

		const firstThought = thoughts[0];
		const lastThought = thoughts[thoughts.length - 1];
		const revisionCount = thoughts.filter(t => t.is_revision).length;
		const totalExpected = lastThought.total_thoughts || thoughts.length;
		const completionPercentage = (thoughts.length / totalExpected) * 100;

		const uniqueSteps = new Set(thoughts.map(t => t.thought_number)).size;
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

/**
 * Get all branch IDs from the branches record.
 */
export function getAllBranchIds(
	branches: Record<string, ThoughtData[]>,
): string[] {
	return Object.keys(branches);
}
