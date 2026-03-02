/**
 * Types for the Search Thoughts tool
 */
import { z } from 'zod/v4';
import { SEARCH_THOUGHTS_INPUT_SCHEMA } from './schema.js';
import { ThoughtData } from '../sequentialthinking/types.js';

export type SearchThoughtsInput = z.infer<typeof SEARCH_THOUGHTS_INPUT_SCHEMA>;

export interface SearchResult {
	thought: string;
	thought_number: number;
	branch_id?: string;
}

export interface SearchThoughtsResult {
	content: Array<{ type: 'text'; text: string }>;
	isError?: boolean;
	[x: string]: unknown;
}

export interface SearchContext {
	thought_history: ThoughtData[];
	branches: Record<string, ThoughtData[]>;
}
