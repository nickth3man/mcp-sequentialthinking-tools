import { z } from 'zod/v4';
import { RECOMMEND_BRANCH_INPUT_SCHEMA } from './schema.js';

export type RecommendBranchInput = z.infer<typeof RECOMMEND_BRANCH_INPUT_SCHEMA>;

export interface RecommendBranchResult {
	content: Array<{ type: 'text'; text: string }>;
	isError?: boolean;
	[x: string]: unknown;
}
