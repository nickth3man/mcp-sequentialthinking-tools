import { z } from 'zod/v4';
import { CREATE_BRANCH_INPUT_SCHEMA } from './schema.js';

export type CreateBranchInput = z.infer<typeof CREATE_BRANCH_INPUT_SCHEMA>;

export interface CreateBranchResult {
	content: Array<{ type: 'text'; text: string }>;
	isError?: boolean;
}
