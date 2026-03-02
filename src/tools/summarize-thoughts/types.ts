/**
 * Types for the Summarize Thoughts tool
 */
import { z } from 'zod/v4';
import { SUMMARIZE_THOUGHTS_INPUT_SCHEMA } from './schema.js';
import { ThoughtData } from '../sequentialthinking/types.js';

export type SummarizeThoughtsInput = z.infer<typeof SUMMARIZE_THOUGHTS_INPUT_SCHEMA>;

export interface SummarizeThoughtsResult {
	content: Array<{ type: 'text'; text: string }>;
	isError?: boolean;
	[x: string]: unknown;
}

export interface SummarizeContext {
	thought_history: ThoughtData[];
	branches: Record<string, ThoughtData[]>;
}
