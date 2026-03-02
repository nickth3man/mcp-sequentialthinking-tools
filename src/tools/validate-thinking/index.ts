import { ValidateThinkingInput, ValidateThinkingResult, ValidationContext, ValidationIssue } from './types.js';
import { formatErrorResponse } from '../shared/error.js';

// Constants for validation patterns
const MIN_KEYWORD_LENGTH = 3;
const DEFAULT_INDENT_SIZE = 2;

// Pre-compiled vague language patterns for performance
const VAGUE_PATTERNS: ReadonlyArray<RegExp> = [
	/maybe\s+/i, /probably\s+/i, /something\s+/i, /somehow\s+/i,
	/kinda\s+/i, /kind\s+of\s+/i, /sort\s+of\s+/i,
	/whatever\s+/i, /stuff\s+/i, /things\s+/i,
];

// Pre-compiled bias indicator patterns
const BIAS_PATTERNS: ReadonlyArray<RegExp> = [
	/clearly\s+proves/i, /obviously\s+(right|correct|true)/i,
	/always\s+(works|true|correct)/i, /never\s+(fails|wrong)/i,
	/everyone\s+knows/i, /just\s+common\s+sense/i,
];

// Gap indicator patterns
const GAP_INDICATORS: ReadonlyArray<RegExp> = [
	/therefore[,:]?\s+\w+\s+(equals?|is|are)/i,
	/so[,:]?\s+\w+\s+(must|should|will)/i,
	/thus[,:]?\s+\w+/i,
];

// Common stop words to filter out during keyword extraction
const STOP_WORDS: ReadonlySet<string> = new Set([
	'this', 'that', 'with', 'from', 'they', 'have', 'been',
	'were', 'what', 'when', 'where', 'which', 'while', 'about',
]);

interface ValidationResult {
	issues: ValidationIssue[];
	suggestions: string[];
}

/**
 * Creates a standardized error response for missing thoughts
 */
function createNotFoundError(thoughtNumber: number): ValidateThinkingResult {
	return {
		content: [{
			type: 'text' as const,
			text: JSON.stringify(
				{ error: `Thought ${thoughtNumber} not found`, status: 'failed' },
				null,
				DEFAULT_INDENT_SIZE
			),
		}],
		isError: true,
	};
}

/**
 * Validate thinking for quality and consistency issues
 */
export async function validateThinking(
	input: ValidateThinkingInput,
	context: ValidationContext,
): Promise<ValidateThinkingResult> {
	try {
		const targetThought = context.thought_history.find(
			t => t.thought_number === input.thought_number
		);

		if (!targetThought) {
			return createNotFoundError(input.thought_number);
		}

		const thoughtText = targetThought.thought;
		const lowerThoughtText = thoughtText.toLowerCase();
		const result = performValidation(thoughtText, lowerThoughtText, input, context);

		return {
			content: [{
				type: 'text' as const,
				text: JSON.stringify({
					thought_number: input.thought_number,
					is_valid: result.issues.every(i => i.severity !== 'error'),
					issues: result.issues,
					suggestions: result.suggestions,
					checked_circular: input.check_circular ?? false,
					checked_gaps: input.check_gaps ?? false,
					checked_biases: input.check_biases ?? false,
				}, null, DEFAULT_INDENT_SIZE),
			}],
		};
	} catch (error) {
		return formatErrorResponse(error);
	}
}

function performValidation(
	thoughtText: string,
	lowerThoughtText: string,
	input: ValidateThinkingInput,
	context: ValidationContext
): ValidationResult {
	const issues: ValidationIssue[] = [];
	const suggestions: string[] = [];

	validateContentNotEmpty(thoughtText, issues, suggestions);
	validateVagueLanguage(lowerThoughtText, issues, suggestions);

	if (input.check_biases) {
		validateBiases(lowerThoughtText, issues, suggestions);
	}

	if (input.check_gaps && input.thought_number > 1) {
		validateReasoningGaps(lowerThoughtText, input.thought_number, context.thought_history, issues, suggestions);
	}

	if (input.check_circular && input.thought_number > 1) {
		validateCircularReasoning(thoughtText, input.thought_number, context.thought_history, issues, suggestions);
	}

	if (issues.length === 0) {
		suggestions.push('Thought is well-formed and specific');
	}

	return { issues, suggestions };
}

function validateContentNotEmpty(
	thoughtText: string,
	issues: ValidationIssue[],
	suggestions: string[]
): void {
	if (!thoughtText?.trim()) {
		issues.push({
			type: 'empty_content',
			message: 'Thought has no content',
			severity: 'error',
		});
		suggestions.push('Add meaningful content to the thought');
	}
}

function validateVagueLanguage(
	lowerThoughtText: string,
	issues: ValidationIssue[],
	suggestions: string[]
): void {
	const hasVagueLanguage = VAGUE_PATTERNS.some(pattern => pattern.test(lowerThoughtText));
	if (hasVagueLanguage) {
		issues.push({
			type: 'vague_language',
			message: 'Thought contains vague language that lacks specificity',
			severity: 'warning',
		});
		suggestions.push('Replace vague terms like "something", "maybe", "kinda" with specific details');
	}
}

function validateBiases(
	lowerThoughtText: string,
	issues: ValidationIssue[],
	suggestions: string[]
): void {
	const hasBias = BIAS_PATTERNS.some(pattern => pattern.test(lowerThoughtText));
	if (hasBias) {
		issues.push({
			type: 'potential_bias',
			message: 'Potential confirmation bias or overconfidence detected',
			severity: 'warning',
		});
		suggestions.push('Consider alternative viewpoints or evidence that might contradict your position');
	}
}

function validateReasoningGaps(
	lowerThoughtText: string,
	thoughtNumber: number,
	thoughtHistory: Array<{ thought_number: number; thought: string }>,
	issues: ValidationIssue[],
	suggestions: string[]
): void {
	const hasGapIndicator = GAP_INDICATORS.some(pattern => pattern.test(lowerThoughtText));
	if (!hasGapIndicator) return;

	const prevThought = thoughtHistory.find(t => t.thought_number === thoughtNumber - 1);
	if (prevThought) {
		issues.push({
			type: 'reasoning_gap',
			message: 'Possible gap in reasoning - conclusion may not follow from previous thought',
			severity: 'warning',
		});
		suggestions.push('Explicitly connect your conclusion to the previous reasoning step');
	}
}

function validateCircularReasoning(
	thoughtText: string,
	thoughtNumber: number,
	thoughtHistory: Array<{ thought_number: number; thought: string }>,
	issues: ValidationIssue[],
	suggestions: string[]
): void {
	for (let i = 0; i < thoughtNumber - 1; i++) {
		const prevThought = thoughtHistory.find(t => t.thought_number === i + 1);
		if (prevThought && hasCircularReference(thoughtText, prevThought.thought)) {
			issues.push({
				type: 'circular_reasoning',
				message: `Potential circular reasoning with thought ${i + 1}`,
				severity: 'error',
			});
			suggestions.push('Avoid using a conclusion as a premise for itself');
			break;
		}
	}
}

/**
 * Extract meaningful keywords from text
 */
function extractKeywords(text: string): string[] {
	return text.toLowerCase()
		.replace(/[^\w\s]/g, '')
		.split(/\s+/)
		.filter(w => w.length > MIN_KEYWORD_LENGTH)
		.filter(w => !STOP_WORDS.has(w));
}

/**
 * Check for circular reference patterns between current and previous thought
 */
function hasCircularReference(current: string, previous: string): boolean {
	const currentLower = current.toLowerCase();
	const prevLower = previous.toLowerCase();

	// Match pattern like "Y is true because of X" - extracting Y and X
	const becauseMatch = currentLower.match(/(\w+)(?:\s+\w+){0,3}\s+because\s+(?:of\s+)?(\w+)/);
	if (becauseMatch) {
		const [, x, y] = becauseMatch;
		if (prevLower.includes(y) && prevLower.includes('because') && prevLower.includes(x)) {
			return true;
		}
	}

	return false;
}
