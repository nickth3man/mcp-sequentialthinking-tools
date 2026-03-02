/**
 * Types for the Track Constraints tool
 */
import { z } from 'zod/v4';
import { TRACK_CONSTRAINTS_INPUT_SCHEMA } from './schema.js';

export type TrackConstraintsInput = z.infer<typeof TRACK_CONSTRAINTS_INPUT_SCHEMA>;

export interface Constraint {
	constraint_id?: string;
	description: string;
	type: string;
	priority: string;
	status: string;
	thought_number?: number;
}

export interface TrackConstraintsResult {
	content: Array<{ type: 'text'; text: string }>;
	isError?: boolean;
	[x: string]: unknown;
}

export interface ConstraintsContext {
	constraints: Map<string, Constraint>;
}
