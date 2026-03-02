import { z } from 'zod/v4';

// Create Branch Tool Description
const CREATE_BRANCH_DESCRIPTION = `A tool for creating a new branch from an existing thought in the sequential thinking process.

This tool creates a named branch point from a specific thought, optionally seeding it with an initial thought. It's useful for exploring alternative approaches without losing the original thinking path.

When to use this tool:
- You want to explore an alternative approach from a specific thought
- You need to create a named branch for later reference
- You want to fork your thinking at a decision point

Features:
- Creates a named branch from any existing thought in history
- Optionally seeds the branch with an initial thought
- Validates that the source thought exists
- Prevents duplicate branch names
- Returns branch metadata including existing branches`;

export const CREATE_BRANCH_INPUT_SCHEMA = z.object({
	thought_number: z.number().int().min(1).describe('The thought number to branch from'),
	branch_id: z.string().min(1).max(256).describe('Unique identifier for the new branch'),
	thought: z.string().max(100000).optional().describe('Optional initial thought content for the branch'),
});

export const CREATE_BRANCH_TOOL = {
	name: 'create_branch',
	description: CREATE_BRANCH_DESCRIPTION,
};
