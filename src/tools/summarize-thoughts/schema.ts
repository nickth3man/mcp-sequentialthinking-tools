import { z } from 'zod/v4';

const SUMMARIZE_THOUGHTS_DESCRIPTION = `Generate a concise summary of thoughts from a thinking sequence.

This tool extracts key points, decisions, and action items from a range of thoughts, making it easy to understand the essence of a long thinking process without reading every detail.

Use this when:
- You need a quick recap of a complex thinking session
- You want to extract decisions made during the process
- You need to communicate thinking results to others
- You want to identify action items and next steps

Features:
- Configurable detail levels (brief, medium, detailed)
- Key point extraction
- Decision identification
- Action item extraction
- Support for both main history and branches`;

export const SUMMARIZE_THOUGHTS_INPUT_SCHEMA = z.object({
	start_thought: z.number().int().min(1).describe('The first thought number to include in the summary'),
	end_thought: z.number().int().min(1).describe('The last thought number to include in the summary'),
	detail_level: z.enum(['low', 'medium', 'high']).describe('Level of detail for the summary'),
	include_action_items: z.boolean().optional().describe('Whether to extract action items from the thoughts'),
});

export const SUMMARIZE_THOUGHTS_TOOL = {
	name: 'summarize_thoughts',
	description: SUMMARIZE_THOUGHTS_DESCRIPTION,
};
