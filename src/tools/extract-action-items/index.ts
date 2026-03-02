import { ExtractActionItemsInput, ExtractActionItemsResult, ExtractContext, ActionItem } from './types.js';
import { formatErrorResponse } from '../shared/error.js';
import { ThoughtData } from '../sequentialthinking/types.js';

const DEFAULT_INDENT_SIZE = 2;

// Pre-compiled regex patterns for performance
const EXPLICIT_MARKERS: ReadonlyArray<RegExp> = [
	/^todo[:\s]/i,
	/^action[:\s]/i,
	/\btodo[:\s]/i,
	/\baction[:\s]/i,
];

const IMPLICIT_PHRASES: ReadonlyArray<RegExp> = [
	/need to\s+\w+/i, /must\s+\w+/i, /should\s+\w+/i, /will\s+\w+/i,
	/plan to\s+\w+/i, /going to\s+\w+/i, /have to\s+\w+/i,
	/implementation[:\s]/i, /set up\s+/i, /configure\s+/i,
	/deploy\s+/i, /test\s+/i, /create\s+/i, /implement\s+/i,
	/fix\s+/i, /update\s+/i, /research\s+/i, /investigate\s+/i,
];

const HIGH_PRIORITY_INDICATORS: ReadonlyArray<RegExp> = [
	/urgent/i, /critical/i, /asap/i, /immediately/i,
	/blocking/i, /breaking/i, /security/i, /vulnerability/i,
];

const COMPLETED_INDICATORS: ReadonlyArray<RegExp> = [
	/done/i, /completed/i, /finished/i, /implemented/i, /fixed/i, /resolved/i,
];

const PRIORITY_ORDER: Record<ActionItem['priority'], number> = {
	high: 0,
	medium: 1,
	low: 2,
};

/**
 * Extract action items from thoughts
 */
export async function extractActionItems(
	input: ExtractActionItemsInput,
	context: ExtractContext,
): Promise<ExtractActionItemsResult> {
	try {
		const allThoughts = collectAllThoughts(context);
		const actionItems = extractAllActionItems(allThoughts);
		const filteredItems = filterByScope(actionItems, input.scope);
		const sortedItems = sortByPriority(filteredItems);

		return {
			content: [{
				type: 'text' as const,
				text: JSON.stringify({
					action_items: sortedItems,
					total_found: actionItems.length,
					returned: sortedItems.length,
					scope: input.scope,
					by_priority: countByPriority(sortedItems),
				}, null, DEFAULT_INDENT_SIZE),
			}],
		};
	} catch (error) {
		return formatErrorResponse(error);
	}
}

function collectAllThoughts(context: ExtractContext): ThoughtData[] {
	const allThoughts = [...context.thought_history];

	for (const branchThoughts of Object.values(context.branches)) {
		allThoughts.push(...branchThoughts);
	}

	return allThoughts;
}

function extractAllActionItems(thoughts: ThoughtData[]): ActionItem[] {
	const actionItems: ActionItem[] = [];

	for (const thought of thoughts) {
		const items = extractFromThought(thought);
		actionItems.push(...items);
	}

	return actionItems;
}

function filterByScope(
	items: ActionItem[],
	scope: ExtractActionItemsInput['scope']
): ActionItem[] {
	switch (scope) {
		case 'incomplete':
			return items.filter(item => item.status !== 'completed');
		case 'completed':
			return items.filter(item => item.status === 'completed');
		case 'all':
		default:
			return items;
	}
}

function sortByPriority(items: ActionItem[]): ActionItem[] {
	return [...items].sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
}

function countByPriority(items: ActionItem[]): Record<ActionItem['priority'], number> {
	return {
		high: items.filter(i => i.priority === 'high').length,
		medium: items.filter(i => i.priority === 'medium').length,
		low: items.filter(i => i.priority === 'low').length,
	};
}

function extractFromThought(thought: ThoughtData): ActionItem[] {
	const items: ActionItem[] = [];
	const text = thought.thought;
	const sentences = text.split(/[.!?]+/);

	for (const sentence of sentences) {
		const trimmed = sentence.trim();
		if (!trimmed) continue;

		const actionItem = tryExtractActionItem(trimmed, thought.thought_number);
		if (actionItem) {
			items.push(actionItem);
		}
	}

	return items;
}

function tryExtractActionItem(text: string, thoughtNumber: number): ActionItem | null {
	if (!isActionable(text)) {
		return null;
	}

	return {
		text: cleanActionText(text),
		thought_number: thoughtNumber,
		priority: determinePriority(text),
		status: determineStatus(text),
	};
}

function isActionable(text: string): boolean {
	const hasExplicitMarker = EXPLICIT_MARKERS.some(pattern => pattern.test(text));
	const hasImplicitPhrase = IMPLICIT_PHRASES.some(pattern => pattern.test(text));
	return hasExplicitMarker || hasImplicitPhrase;
}

function cleanActionText(text: string): string {
	return text
		.replace(/^todo[:\s]+/i, '')
		.replace(/^action[:\s]+/i, '');
}

function determinePriority(text: string): ActionItem['priority'] {
	const lowerText = text.toLowerCase();
	const isHighPriority = HIGH_PRIORITY_INDICATORS.some(pattern => pattern.test(lowerText));
	return isHighPriority ? 'high' : 'medium';
}

function determineStatus(text: string): ActionItem['status'] {
	const lowerText = text.toLowerCase();
	const isCompleted = COMPLETED_INDICATORS.some(pattern => pattern.test(lowerText));
	return isCompleted ? 'completed' : 'pending';
}
