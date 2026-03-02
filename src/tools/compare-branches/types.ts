import { z } from 'zod/v4';
import { COMPARE_BRANCHES_INPUT_SCHEMA } from './schema.js';

export type CompareBranchesInput = z.infer<typeof COMPARE_BRANCHES_INPUT_SCHEMA>;

export interface CompareBranchesResult {
	content: Array<{ type: 'text'; text: string }>;
	isError?: boolean;
}
