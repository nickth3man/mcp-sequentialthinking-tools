import { z } from 'zod/v4';

const TRACK_CONSTRAINTS_DESCRIPTION = `Track and manage constraints, requirements, and assumptions throughout the thinking process.

This tool helps maintain awareness of limiting factors, requirements, and assumptions that should guide the thinking process. It ensures constraints are not forgotten and can detect conflicts between competing constraints.

Use this when:
- You need to record a constraint or requirement
- You want to track assumptions that could affect the solution
- You need to check for conflicts between constraints
- You want to see what constraints are still active
- You need to mark a constraint as satisfied or no longer applicable

Features:
- Add, update, and remove constraints
- Categorize by type (technical, business, temporal, etc.)
- Set priority levels
- Track constraint status (active, satisfied, violated, waived)
- Detect potential conflicts between constraints
- Filter constraints by status or type`;

export const TRACK_CONSTRAINTS_INPUT_SCHEMA = z.object({
	action: z.enum(['add', 'update', 'remove', 'list', 'check']).describe('The action to perform on constraints'),
	constraint_id: z.string().max(256).optional().describe('Unique identifier for the constraint (required for add/update/remove)'),
	description: z.string().max(10000).optional().describe('Description of the constraint (required for add)'),
	type: z.enum(['technical', 'business', 'financial', 'temporal', 'resource', 'legal', 'other']).optional().describe('Type of constraint'),
	priority: z.enum(['low', 'medium', 'high', 'critical']).optional().describe('Priority level of the constraint'),
	status: z.enum(['active', 'satisfied', 'violated', 'waived']).optional().describe('Current status of the constraint'),
	thought_number: z.number().int().min(1).optional().describe('The thought number where this constraint was introduced'),
	filter_status: z.enum(['active', 'satisfied', 'violated', 'waived', 'all']).optional().describe('Filter constraints by status when listing'),
});

export const TRACK_CONSTRAINTS_TOOL = {
	name: 'track_constraints',
	description: TRACK_CONSTRAINTS_DESCRIPTION,
};
