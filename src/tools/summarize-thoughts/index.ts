import { SummarizeThoughtsInput, SummarizeThoughtsResult, SummarizeContext } from './types.js';
import { formatErrorResponse } from '../shared/error.js';
import { ThoughtData } from '../sequentialthinking/types.js';

const DEFAULT_INDENT_SIZE = 2;
const MIN_SENTENCE_LENGTH = 15;
const MAX_KEY_POINTS = 5;
const MAX_DECISIONS = 5;
const MAX_ACTION_ITEMS = 10;

// Pre-defined keyword sets for categorization
const DECISION_KEYWORDS: ReadonlySet<string> = new Set([
	'decision', 'decided', 'choose', 'chose', 'conclusion', 'conclude',
	'select', 'selected', 'pick', 'picked', 'opt', 'opted', 'determine', 'determined',
]);

const ACTION_KEYWORDS: ReadonlySet<string> = new Set([
	'todo', 'action', 'need to', 'must', 'should', 'will', 'plan to',
	'implement', 'create', 'set up', 'configure', 'deploy', 'test',
]);

const IMPORTANCE_INDICATORS: ReadonlySet<string> = new Set([
	'important', 'key', 'critical', 'essential', 'crucial', 'vital',
]);

type DetailLevel = 'low' | 'medium' | 'high';

interface ThoughtSummary {
	summary: string;
	key_points: string[];
	decisions: string[];
	action_items?: string[];
}

/**
 * Creates a standardized error response
 */
function createErrorResponse(message: string): SummarizeThoughtsResult {
	return {
		content: [{
			type: 'text' as const,
			text: JSON.stringify({ error: message, status: 'failed' }, null, DEFAULT_INDENT_SIZE),
		}],
		isError: true,
	};
}

/**
 * Summarize a range of thoughts
 */
export async function summarizeThoughts(
	input: SummarizeThoughtsInput,
	context: SummarizeContext,
): Promise<SummarizeThoughtsResult> {
	try {
		if (input.start_thought > input.end_thought) {
			return createErrorResponse(
				'Invalid range: start_thought must be less than or equal to end_thought'
			);
		}

		if (context.thought_history.length === 0) {
			return createErrorResponse('No thoughts in history');
		}

		const thoughtsInRange = getThoughtsInRange(
			context.thought_history,
			input.start_thought,
			input.end_thought
		);

		if (thoughtsInRange.length === 0) {
			return createErrorResponse(
				`No thoughts found in range ${input.start_thought}-${input.end_thought}`
			);
		}

		const summary = generateThoughtSummary(
			thoughtsInRange,
			input.detail_level,
			input.include_action_items ?? false
		);

		return {
			content: [{
				type: 'text' as const,
				text: JSON.stringify({
					...summary,
					thoughts_included: thoughtsInRange.length,
					range: { start: input.start_thought, end: input.end_thought },
					detail_level: input.detail_level,
				}, null, DEFAULT_INDENT_SIZE),
			}],
		};
	} catch (error) {
		return formatErrorResponse(error);
	}
}

function getThoughtsInRange(
	thoughtHistory: ThoughtData[],
	startThought: number,
	endThought: number
): ThoughtData[] {
	return thoughtHistory.filter(
		t => t.thought_number >= startThought && t.thought_number <= endThought
	);
}

function generateThoughtSummary(
	thoughts: ThoughtData[],
	detailLevel: DetailLevel,
	includeActionItems: boolean
): ThoughtSummary {
	return {
		summary: generateSummary(thoughts, detailLevel),
		key_points: extractKeyPoints(thoughts),
		decisions: extractDecisions(thoughts),
		action_items: includeActionItems ? extractActionItemsFromThoughts(thoughts) : undefined,
	};
}

function generateSummary(thoughts: ThoughtData[], detailLevel: DetailLevel): string {
	const thoughtsText = thoughts.map(t => t.thought).join(' ');

	switch (detailLevel) {
		case 'low':
			return generateBriefSummary(thoughts);
		case 'medium':
			return generateMediumSummary(thoughtsText);
		case 'high':
		default:
			return generateDetailedSummary(thoughtsText);
	}
}

function generateBriefSummary(thoughts: ThoughtData[]): string {
	const first = thoughts[0]?.thought.split('.')[0] ?? '';
	const last = thoughts[thoughts.length - 1]?.thought.split('.')[0] ?? '';
	return `Started with: "${first}". Concluded with: "${last}"`;
}

function generateMediumSummary(thoughtsText: string): string {
	const sentences = extractSentences(thoughtsText, 20, 150);
	return sentences.slice(0, 3).join('. ') + '.';
}

function generateDetailedSummary(thoughtsText: string): string {
	const sentences = extractSentences(thoughtsText, MIN_SENTENCE_LENGTH, Infinity);
	return sentences.slice(0, 8).join('. ') + '.';
}

function extractSentences(text: string, minLength: number, maxLength: number): string[] {
	return text
		.split(/[.!?]+/)
		.map(s => s.trim())
		.filter(s => s.length >= minLength && (maxLength === Infinity || s.length <= maxLength));
}

function extractKeyPoints(thoughts: ThoughtData[]): string[] {
	const points: string[] = [];

	for (const thought of thoughts) {
		const sentences = thought.thought.split(/[.!?]+/);
		for (const sentence of sentences) {
			const trimmed = sentence.trim();
			if (isImportantSentence(trimmed)) {
				points.push(trimmed);
			}
		}
	}

	return [...new Set(points)].slice(0, MAX_KEY_POINTS);
}

function isImportantSentence(sentence: string): boolean {
	if (sentence.length <= 20 || sentence.length >= 200) return false;

	const lower = sentence.toLowerCase();
	const hasDecisionKeyword = Array.from(DECISION_KEYWORDS).some(k => lower.includes(k));
	const hasImportanceIndicator = Array.from(IMPORTANCE_INDICATORS).some(i => lower.includes(i));

	return hasDecisionKeyword || hasImportanceIndicator;
}

function extractDecisions(thoughts: ThoughtData[]): string[] {
	const decisions: string[] = [];

	for (const thought of thoughts) {
		const sentences = thought.thought.split(/[.!?]+/);
		for (const sentence of sentences) {
			const trimmed = sentence.trim();
			if (isDecisionSentence(trimmed)) {
				decisions.push(trimmed);
			}
		}
	}

	return [...new Set(decisions)].slice(0, MAX_DECISIONS);
}

function isDecisionSentence(sentence: string): boolean {
	const lower = sentence.toLowerCase();
	return Array.from(DECISION_KEYWORDS).some(k => lower.includes(k));
}

function extractActionItemsFromThoughts(thoughts: ThoughtData[]): string[] {
	const items: string[] = [];

	for (const thought of thoughts) {
		const sentences = thought.thought.split(/[.!?]+/);
		for (const sentence of sentences) {
			const trimmed = sentence.trim();
			if (isActionableSentence(trimmed)) {
				items.push(trimmed);
			}
		}
	}

	return [...new Set(items)].slice(0, MAX_ACTION_ITEMS);
}

function isActionableSentence(sentence: string): boolean {
	const lower = sentence.toLowerCase();

	// Check for explicit markers
	if (lower.startsWith('todo:') || lower.startsWith('action:')) {
		return true;
	}

	// Check for action keywords
	if (sentence.length > 10 && sentence.length < 150) {
		return Array.from(ACTION_KEYWORDS).some(k => lower.includes(k));
	}

	return false;
}
