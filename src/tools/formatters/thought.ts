import chalk from 'chalk';
import type { ThoughtData } from '../sequentialthinking/types.js';
import { formatRecommendation } from './recommendation.js';

/**
 * Format a thought for display
 */
export function formatThought(thoughtData: ThoughtData): string {
	const {
		thought_number,
		total_thoughts,
		thought,
		is_revision,
		revises_thought,
		branch_from_thought,
		branch_id,
		current_step,
	} = thoughtData;

	let prefix = '';
	let context = '';

	if (is_revision) {
		prefix = chalk.yellow('🔄 Revision');
		context = ` (revising thought ${revises_thought})`;
	} else if (branch_from_thought) {
		prefix = chalk.green('🌿 Branch');
		context = ` (from thought ${branch_from_thought}, ID: ${branch_id})`;
	} else {
		prefix = chalk.blue('💭 Thought');
		context = '';
	}

	const header = `${prefix} ${thought_number}/${total_thoughts}${context}`;
	let content = thought;

	// Add recommendation information if present
	if (current_step) {
		content = `${thought}\n\nRecommendation:\n${formatRecommendation(current_step)}`;
	}

	const border = '─'.repeat(
		Math.max(header.length, content.length) + 4,
	);

	return `
┌${border}┐
│ ${header} │
├${border}┤
│ ${content.padEnd(border.length - 2)} │
└${border}┘`;
}
