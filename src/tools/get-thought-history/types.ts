import { z } from 'zod/v4';
import { GET_THOUGHT_HISTORY_INPUT_SCHEMA } from './schema.js';

export type GetThoughtHistoryInput = z.infer<typeof GET_THOUGHT_HISTORY_INPUT_SCHEMA>;

export interface GetThoughtHistoryResult {
	content: Array<{ type: 'text'; text: string }>;
	isError?: boolean;
}
