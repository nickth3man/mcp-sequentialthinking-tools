import { z } from 'zod/v4';

const VALIDATE_THINKING_DESCRIPTION = `Validate the quality and consistency of thinking at a specific thought or across a sequence.

This tool analyzes thinking patterns to detect potential issues like:
- Circular reasoning or logical inconsistencies
- Vague language that lacks specificity
- Reasoning gaps where steps are missing
- Potential cognitive biases
- Empty or insufficient content

Use this tool to quality-check your thinking process before committing to a path, or to identify areas where more rigor is needed.

Features:
- Single thought validation for immediate feedback
- Sequence validation to check reasoning chains
- Bias detection for common cognitive pitfalls
- Gap analysis for missing logical steps
- Actionable suggestions for improvement`;

export const VALIDATE_THINKING_INPUT_SCHEMA = z.object({
	thought_number: z.number().int().min(1).describe('The thought number to validate (validates this thought and optionally the sequence leading to it)'),
	check_circular: z.boolean().optional().describe('Whether to check for circular reasoning in the sequence'),
	check_gaps: z.boolean().optional().describe('Whether to check for gaps in logical reasoning'),
	check_biases: z.boolean().optional().describe('Whether to check for potential cognitive biases'),
});

export const VALIDATE_THINKING_TOOL = {
	name: 'validate_thinking',
	description: VALIDATE_THINKING_DESCRIPTION,
};
