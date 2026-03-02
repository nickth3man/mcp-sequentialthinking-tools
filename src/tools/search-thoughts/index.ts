import { SearchThoughtsInput, SearchThoughtsResult, SearchContext } from './types.js';
import { formatErrorResponse } from '../shared/error.js';

const DEFAULT_INDENT_SIZE = 2;

type ThoughtSummary = {
	thought: string;
	thought_number: number;
	branch_id?: string;
};

/**
 * Creates a standardized error response
 */
function createErrorResponse(message: string): SearchThoughtsResult {
	return {
		content: [{
			type: 'text' as const,
			text: JSON.stringify({ error: message, status: 'failed' }, null, DEFAULT_INDENT_SIZE),
		}],
		isError: true,
	};
}

/**
 * Search through thought history for matching content
 */
export async function searchThoughts(
	input: SearchThoughtsInput,
	context: SearchContext,
): Promise<SearchThoughtsResult> {
	try {
		const thoughtsToSearch = input.branch_id
			? getBranchThoughts(context.branches, input.branch_id)
			: getMainHistoryThoughts(context.thought_history);

		if (isErrorResult(thoughtsToSearch)) {
			return thoughtsToSearch;
		}

		const searchTerm = normalizeSearchTerm(input.query, input.case_sensitive);
		const results = performSearch(thoughtsToSearch, searchTerm, input.case_sensitive);

		return {
			content: [{
				type: 'text' as const,
				text: JSON.stringify({
					results: results.map(r => ({
						thought: r.thought,
						thought_number: r.thought_number,
						branch_id: r.branch_id,
					})),
					match_count: results.length,
					total_thoughts_searched: thoughtsToSearch.length,
					query: input.query,
					branch_id: input.branch_id ?? null,
				}, null, DEFAULT_INDENT_SIZE),
			}],
		};
	} catch (error) {
		return formatErrorResponse(error);
	}
}

function isErrorResult(
	result: ThoughtSummary[] | SearchThoughtsResult
): result is SearchThoughtsResult {
	return 'isError' in result;
}

function getBranchThoughts(
	branches: Record<string, Array<{ thought: string; thought_number: number; branch_id?: string }>>,
	branchId: string
): ThoughtSummary[] | SearchThoughtsResult {
	const branch = branches[branchId];
	if (!branch) {
		return createErrorResponse(`Branch '${branchId}' not found`);
	}
	return branch.map(t => ({
		thought: t.thought,
		thought_number: t.thought_number,
		branch_id: t.branch_id,
	}));
}

function getMainHistoryThoughts(
	thoughtHistory: Array<{ thought: string; thought_number: number }>
): ThoughtSummary[] {
	return thoughtHistory.map(t => ({
		thought: t.thought,
		thought_number: t.thought_number,
	}));
}

function normalizeSearchTerm(query: string, caseSensitive: boolean): string {
	return caseSensitive ? query : query.toLowerCase();
}

function performSearch(
	thoughts: ThoughtSummary[],
	searchTerm: string,
	caseSensitive: boolean
): ThoughtSummary[] {
	return thoughts.filter(t => {
		const thoughtContent = caseSensitive ? t.thought : t.thought.toLowerCase();
		return thoughtContent.includes(searchTerm);
	});
}
