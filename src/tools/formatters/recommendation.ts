import type { StepRecommendation } from '../sequentialthinking/types.js';

/**
 * Format a step recommendation for display
 */
export function formatRecommendation(step: StepRecommendation): string {
	const tools = step.recommended_tools
		.map((tool) => {
			const alternatives = tool.alternatives?.length 
				? ` (alternatives: ${tool.alternatives.join(', ')})`
				: '';
			const inputs = tool.suggested_inputs 
				? `\n    Suggested inputs: ${JSON.stringify(tool.suggested_inputs)}`
				: '';
			return `  - ${tool.tool_name} (priority: ${tool.priority})${alternatives}\n    Rationale: ${tool.rationale}${inputs}`;
		})
		.join('\n');

	return `Step: ${step.step_description}
Recommended Tools:
${tools}
Expected Outcome: ${step.expected_outcome}${
		step.next_step_conditions
			? `\nConditions for next step:\n  - ${step.next_step_conditions.join('\n  - ')}`
			: ''
	}`;
}
