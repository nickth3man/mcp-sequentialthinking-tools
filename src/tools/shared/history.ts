/**
 * Shared history management utilities
 */
import type { ThoughtData } from '../sequentialthinking/types.js';

export interface HistoryStats {
	total_thoughts: number;
	revision_count: number;
	branch_count: number;
	unique_branch_ids: string[];
}

/**
 * Add a thought to history, auto-trimming if maxSize is exceeded.
 * Mutates the history array in place.
 */
export function addToHistory(
	thought: ThoughtData,
	history: ThoughtData[],
	maxSize: number,
): void {
	history.push(thought);
	trimHistory(history, maxSize);
}

/**
 * Trim history to maxSize, keeping the most recent items.
 * Mutates the array in place.
 */
export function trimHistory(
	history: ThoughtData[],
	maxSize: number,
): void {
	if (history.length > maxSize) {
		const removeCount = history.length - maxSize;
		history.splice(0, removeCount);
	}
}

/**
 * Get statistics about the thought history.
 */
export function getHistoryStats(history: ThoughtData[]): HistoryStats {
	const branchIds = new Set<string>();

	let revisionCount = 0;
	let branchCount = 0;

	for (const thought of history) {
		if (thought.is_revision) {
			revisionCount++;
		}
		if (thought.branch_id) {
			branchIds.add(thought.branch_id);
			branchCount++;
		}
	}

	return {
		total_thoughts: history.length,
		revision_count: revisionCount,
		branch_count: branchCount,
		unique_branch_ids: [...branchIds],
	};
}
