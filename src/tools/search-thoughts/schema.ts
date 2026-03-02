import { z } from 'zod/v4';

const SEARCH_THOUGHTS_DESCRIPTION = `Search through thought history and branches to find relevant thoughts.

This tool enables targeted retrieval of thoughts from the thinking history based on content matching. It's useful for:
- Finding relevant past thoughts when continuing a complex problem
- Avoiding duplicated work by checking previous reasoning
- Retrieving context from previous sessions
- Locating specific ideas or decisions in long thinking chains

Features:
- Content-based search with substring matching
- Case-sensitive or case-insensitive search
- Search within main history or specific branches
- Returns match count and relevance information

The tool returns matching thoughts with their thought numbers, allowing you to reference them in subsequent thinking steps.`;

export const SEARCH_THOUGHTS_INPUT_SCHEMA = z.object({
	query: z.string().max(10000).describe('The search query string to match against thought content'),
	search_in: z.enum(['content']).describe('Field to search in (currently only supports content)'),
	branch_id: z.string().max(256).optional().describe('Specific branch to search in (searches main history if undefined)'),
	case_sensitive: z.boolean().describe('Whether the search should be case-sensitive'),
});

export const SEARCH_THOUGHTS_TOOL = {
	name: 'search_thoughts',
	description: SEARCH_THOUGHTS_DESCRIPTION,
};
