import { z } from 'zod/v4';

// Get Thought History Tool Description
const GET_THOUGHT_HISTORY_DESCRIPTION = `A tool for retrieving and filtering thought history from the sequential thinking process.

This tool provides flexible querying of stored thoughts with support for pagination, filtering, and sorting. Use it to review past thinking, analyze patterns, or retrieve specific thoughts by branch or revision status.

When to use this tool:
- You need to review previous thoughts in the thinking process
- You want to analyze thoughts from a specific branch
- You need to paginate through large thought histories
- You want to filter out revisions to see only final thoughts
- You need statistics about the thinking process

Features:
- Pagination with offset and limit
- Filter by branch_id
- Filter out revisions
- Reverse chronological order
- Summary statistics including branch list and revision count`;

export const GET_THOUGHT_HISTORY_INPUT_SCHEMA = z.object({
	limit: z.number().int().min(1).max(1000).optional().describe('Maximum number of thoughts to return (default: all)'),
	offset: z.number().int().min(0).optional().describe('Number of thoughts to skip (default: 0)'),
	branch_id: z.string().optional().describe('Filter to thoughts with specific branch_id'),
	include_revisions: z.boolean().optional().describe('Include revision thoughts (default: true)'),
	include_branch_info: z.boolean().optional().describe('Include branch metadata in results (default: true)'),
	reverse: z.boolean().optional().describe('Return in reverse chronological order (default: false)'),
});

export const GET_THOUGHT_HISTORY_TOOL = {
	name: 'get_thought_history',
	description: GET_THOUGHT_HISTORY_DESCRIPTION,
};
