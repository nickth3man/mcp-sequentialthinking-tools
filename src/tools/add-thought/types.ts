import { z } from 'zod/v4';
import { ADD_THOUGHT_INPUT_SCHEMA } from './schema.js';

export type AddThoughtInput = z.infer<typeof ADD_THOUGHT_INPUT_SCHEMA>;

export interface AddThoughtResult {
	content: Array<{ type: 'text'; text: string }>;
	isError?: boolean;
}
