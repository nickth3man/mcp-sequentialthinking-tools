import { TrackConstraintsInput, TrackConstraintsResult, ConstraintsContext, Constraint } from './types.js';
import { formatErrorResponse } from '../shared/error.js';

const DEFAULT_INDENT_SIZE = 2;

// Pre-defined conflicting constraint pairs
const CONFLICTING_PAIRS: ReadonlyArray<readonly [string, string]> = [
	['speed', 'memory'],
	['cost', 'quality'],
	['time', 'scope'],
	['security', 'convenience'],
];

type ConstraintAction = 'add' | 'update' | 'remove' | 'list' | 'check';

/**
 * Creates a standardized error response
 */
function createErrorResponse(message: string): TrackConstraintsResult {
	return {
		content: [{
			type: 'text' as const,
			text: JSON.stringify({ error: message, status: 'failed' }, null, DEFAULT_INDENT_SIZE),
		}],
		isError: true,
	};
}

/**
 * Creates a standardized success response
 */
function createSuccessResponse(data: Record<string, unknown>): TrackConstraintsResult {
	return {
		content: [{
			type: 'text' as const,
			text: JSON.stringify(data, null, DEFAULT_INDENT_SIZE),
		}],
	};
}

/**
 * Track and manage constraints
 */
export async function trackConstraints(
	input: TrackConstraintsInput,
	context: ConstraintsContext,
): Promise<TrackConstraintsResult> {
	try {
		const actionHandlers: Record<ConstraintAction, () => TrackConstraintsResult> = {
			add: () => addConstraint(input, context),
			update: () => updateConstraint(input, context),
			remove: () => removeConstraint(input, context),
			list: () => listConstraints(input, context),
			check: () => checkConstraints(context),
		};

		const handler = actionHandlers[input.action as ConstraintAction];
		if (!handler) {
			return createErrorResponse(`Unknown action: ${input.action}`);
		}

		return handler();
	} catch (error) {
		return formatErrorResponse(error);
	}
}

function addConstraint(input: TrackConstraintsInput, context: ConstraintsContext): TrackConstraintsResult {
	if (!input.constraint_id) {
		return createErrorResponse('constraint_id is required for add action');
	}

	if (context.constraints.has(input.constraint_id)) {
		return createErrorResponse(`Constraint '${input.constraint_id}' already exists`);
	}

	const constraint: Constraint = {
		constraint_id: input.constraint_id,
		description: input.description ?? '',
		type: input.type ?? 'other',
		priority: input.priority ?? 'medium',
		status: input.status ?? 'active',
		thought_number: input.thought_number,
	};

	context.constraints.set(input.constraint_id, constraint);

	return createSuccessResponse({
		success: true,
		constraint,
		total_constraints: context.constraints.size,
	});
}

function updateConstraint(input: TrackConstraintsInput, context: ConstraintsContext): TrackConstraintsResult {
	if (!input.constraint_id) {
		return createErrorResponse('constraint_id is required for update action');
	}

	const existing = context.constraints.get(input.constraint_id);
	if (!existing) {
		return createErrorResponse(`Constraint '${input.constraint_id}' not found`);
	}

	// Update only provided fields
	const updated: Constraint = {
		...existing,
		description: input.description ?? existing.description,
		type: input.type ?? existing.type,
		priority: input.priority ?? existing.priority,
		status: input.status ?? existing.status,
		thought_number: input.thought_number ?? existing.thought_number,
	};

	context.constraints.set(input.constraint_id, updated);

	return createSuccessResponse({
		success: true,
		constraint: updated,
	});
}

function removeConstraint(input: TrackConstraintsInput, context: ConstraintsContext): TrackConstraintsResult {
	if (!input.constraint_id) {
		return createErrorResponse('constraint_id is required for remove action');
	}

	const existed = context.constraints.delete(input.constraint_id);

	return createSuccessResponse({
		success: existed,
		constraint_id: input.constraint_id,
		total_constraints: context.constraints.size,
	});
}

function listConstraints(input: TrackConstraintsInput, context: ConstraintsContext): TrackConstraintsResult {
	const filterStatus = input.filter_status ?? 'all';

	const filteredConstraints = Array.from(context.constraints.entries())
		.filter(([, constraint]) => filterStatus === 'all' || constraint.status === filterStatus)
		.map(([id, constraint]) => ({ ...constraint, constraint_id: id }));

	return createSuccessResponse({
		constraints: filteredConstraints,
		total_constraints: context.constraints.size,
		filtered_count: filteredConstraints.length,
		filter_status: filterStatus,
	});
}

function checkConstraints(context: ConstraintsContext): TrackConstraintsResult {
	const constraints = Array.from(context.constraints.values());
	const conflicts = findConflicts(constraints);

	const activeCount = constraints.filter(c => c.status === 'active').length;
	const violatedCount = constraints.filter(c => c.status === 'violated').length;

	return createSuccessResponse({
		has_conflicts: conflicts.length > 0,
		conflicts,
		total_constraints: constraints.length,
		active_constraints: activeCount,
		violated_constraints: violatedCount,
	});
}

interface Conflict {
	constraint1: string;
	constraint2: string;
	reason: string;
}

function findConflicts(constraints: Constraint[]): Conflict[] {
	const conflicts: Conflict[] = [];

	for (let i = 0; i < constraints.length; i++) {
		for (let j = i + 1; j < constraints.length; j++) {
			const conflict = checkPairForConflict(constraints[i], constraints[j]);
			if (conflict) {
				conflicts.push(conflict);
			}
		}
	}

	return conflicts;
}

function checkPairForConflict(c1: Constraint, c2: Constraint): Conflict | null {
	// Only check active constraints
	if (c1.status !== 'active' || c2.status !== 'active') {
		return null;
	}

	for (const [type1, type2] of CONFLICTING_PAIRS) {
		if ((c1.type === type1 && c2.type === type2) ||
		    (c1.type === type2 && c2.type === type1)) {
			return {
				constraint1: c1.constraint_id ?? 'unknown',
				constraint2: c2.constraint_id ?? 'unknown',
				reason: `Potential conflict between ${c1.type} and ${c2.type} constraints`,
			};
		}
	}

	return null;
}
