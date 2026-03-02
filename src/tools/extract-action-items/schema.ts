import { z } from 'zod/v4';

const EXTRACT_ACTION_ITEMS_DESCRIPTION = `Extract actionable tasks and to-do items from the thinking history.

This tool scans thoughts for explicit action markers (TODO, ACTION) and implicit action phrases ("need to", "should", "will implement") to create a structured list of tasks. It helps convert thinking into execution.

Use this when:
- You want to convert thinking into a concrete task list
- You need to identify what needs to be done next
- You want to ensure no tasks were forgotten during a long thinking session
- You need to prioritize actions based on urgency keywords

Features:
- Automatic detection of TODO and ACTION markers
- Implicit action phrase recognition
- Priority detection from urgency keywords
- Status tracking (pending/completed)
- Thought number references for context
- Filtering by completion status`;

export const EXTRACT_ACTION_ITEMS_INPUT_SCHEMA = z.object({
	scope: z.enum(['all', 'incomplete', 'completed']).describe('Which action items to include'),
	include_completed: z.boolean().optional().describe('Whether to include already completed items (deprecated: use scope instead)'),
});

export const EXTRACT_ACTION_ITEMS_TOOL = {
	name: 'extract_action_items',
	description: EXTRACT_ACTION_ITEMS_DESCRIPTION,
};
