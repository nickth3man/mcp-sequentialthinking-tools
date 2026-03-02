import { z } from 'zod/v4';
import { LIST_BRANCHES_INPUT_SCHEMA } from './schema.js';
import { BranchStatistics } from '../branch-explorer/types.js';

export type ListBranchesInput = z.infer<typeof LIST_BRANCHES_INPUT_SCHEMA>;

export interface ListBranchesResult {
	content: Array<{ type: 'text'; text: string }>;
	isError?: boolean;
}

export interface ListBranchesOutput {
	branches: BranchStatistics[];
	total_branches: number;
}
