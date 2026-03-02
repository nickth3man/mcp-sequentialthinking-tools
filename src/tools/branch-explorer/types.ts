/**
 * Types for the Branch Explorer tool
 */

// Branch Explorer types
export interface BranchStatistics {
	branch_id: string;
	created_from_thought: number;
	total_thoughts: number;
	revision_count: number;
	last_thought_number: number;
	completion_percentage: number;
	depth_score: number; // Average thoughts per step
}

export interface BranchComparison {
	branches: BranchStatistics[];
	recommendation: string;
	best_branch_id?: string;
	reasoning: string;
}

export interface BranchExplorerInput {
	action: 'list' | 'compare' | 'recommend' | 'merge_insights';
	branch_ids?: string[]; // For compare action
	min_completion_threshold?: number; // Filter branches by completion %
}
