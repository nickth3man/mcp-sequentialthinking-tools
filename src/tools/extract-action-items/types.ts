/**
 * Types for the Extract Action Items tool
 */
import { z } from 'zod/v4';
import { EXTRACT_ACTION_ITEMS_INPUT_SCHEMA } from './schema.js';
import { ThoughtData } from '../sequentialthinking/types.js';

export type ExtractActionItemsInput = z.infer<typeof EXTRACT_ACTION_ITEMS_INPUT_SCHEMA>;

export interface ActionItem {
	text: string;
	thought_number: number;
	priority: 'low' | 'medium' | 'high';
	status: 'pending' | 'in_progress' | 'completed';
}

export interface ExtractActionItemsResult {
	content: Array<{ type: 'text'; text: string }>;
	isError?: boolean;
	[x: string]: unknown;
}

export interface ExtractContext {
	thought_history: ThoughtData[];
	branches: Record<string, ThoughtData[]>;
}
