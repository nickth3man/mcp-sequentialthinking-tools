import { z } from 'zod/v4';
import { MERGE_BRANCH_INSIGHTS_INPUT_SCHEMA } from './schema.js';

export type MergeBranchInsightsInput = z.infer<typeof MERGE_BRANCH_INSIGHTS_INPUT_SCHEMA>;

export interface MergeBranchInsightsResult {
	content: Array<{ type: 'text'; text: string }>;
	isError?: boolean;
	[x: string]: unknown;
}

export interface MergeBranchInsightsOutput {
	insights: string[];
	synthesis: string;
}
