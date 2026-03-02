/**
 * Types for the Validate Thinking tool
 */
import { z } from 'zod/v4';
import { VALIDATE_THINKING_INPUT_SCHEMA } from './schema.js';
import { ThoughtData } from '../sequentialthinking/types.js';

export type ValidateThinkingInput = z.infer<typeof VALIDATE_THINKING_INPUT_SCHEMA>;

export interface ValidationIssue {
	type: string;
	message: string;
	severity: 'warning' | 'error';
}

export interface ValidationResult {
	is_valid: boolean;
	issues: ValidationIssue[];
	suggestions: string[];
}

export interface ValidateThinkingResult {
	content: Array<{ type: 'text'; text: string }>;
	isError?: boolean;
	[x: string]: unknown;
}

export interface ValidationContext {
	thought_history: ThoughtData[];
}
