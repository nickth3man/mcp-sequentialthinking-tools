import { describe, it, expect, beforeEach } from 'vitest';
import { trackConstraints } from './index.js';

describe('track-constraints', () => {
	let constraints: Map<string, {
		description: string;
		type: string;
		priority: string;
		status: string;
		thought_number?: number;
	}>;

	beforeEach(() => {
		constraints = new Map();
	});

	describe('adding constraints', () => {
		it('should add a new constraint', async () => {
			const result = await trackConstraints(
				{
					action: 'add',
					constraint_id: 'budget',
					description: 'Must stay under $10k budget',
					type: 'financial',
					priority: 'high',
					thought_number: 1,
				},
				{ constraints }
			);

			expect(result.isError).toBeUndefined();
			const data = JSON.parse(result.content[0].text);
			expect(data.success).toBe(true);
			expect(constraints.has('budget')).toBe(true);
		});

		it('should return error for duplicate constraint_id', async () => {
			constraints.set('budget', {
				description: 'Existing',
				type: 'financial',
				priority: 'high',
				status: 'active',
			});

			const result = await trackConstraints(
				{
					action: 'add',
					constraint_id: 'budget',
					description: 'Must stay under $10k budget',
					type: 'financial',
					priority: 'high',
				},
				{ constraints }
			);

			expect(result.isError).toBe(true);
		});
	});

	describe('listing constraints', () => {
		it('should list all constraints', async () => {
			constraints.set('budget', {
				description: 'Under $10k',
				type: 'financial',
				priority: 'high',
				status: 'active',
			});
			constraints.set('timeline', {
				description: '2 weeks',
				type: 'temporal',
				priority: 'medium',
				status: 'active',
			});

			const result = await trackConstraints(
				{ action: 'list' },
				{ constraints }
			);

			expect(result.isError).toBeUndefined();
			const data = JSON.parse(result.content[0].text);
			expect(data.constraints).toHaveLength(2);
		});

		it('should filter by status', async () => {
			constraints.set('budget', {
				description: 'Under $10k',
				type: 'financial',
				priority: 'high',
				status: 'satisfied',
			});
			constraints.set('timeline', {
				description: '2 weeks',
				type: 'temporal',
				priority: 'medium',
				status: 'active',
			});

			const result = await trackConstraints(
				{ action: 'list', filter_status: 'active' },
				{ constraints }
			);

			const data = JSON.parse(result.content[0].text);
			expect(data.constraints).toHaveLength(1);
			expect(data.constraints[0].constraint_id).toBe('timeline');
		});
	});

	describe('updating constraints', () => {
		it('should update constraint status', async () => {
			constraints.set('budget', {
				description: 'Under $10k',
				type: 'financial',
				priority: 'high',
				status: 'active',
			});

			const result = await trackConstraints(
				{
					action: 'update',
					constraint_id: 'budget',
					status: 'satisfied',
				},
				{ constraints }
			);

			expect(result.isError).toBeUndefined();
			expect(constraints.get('budget')?.status).toBe('satisfied');
		});

		it('should return error for non-existent constraint', async () => {
			const result = await trackConstraints(
				{
					action: 'update',
					constraint_id: 'nonexistent',
					status: 'satisfied',
				},
				{ constraints }
			);

			expect(result.isError).toBe(true);
		});
	});

	describe('removing constraints', () => {
		it('should remove a constraint', async () => {
			constraints.set('budget', {
				description: 'Under $10k',
				type: 'financial',
				priority: 'high',
				status: 'active',
			});

			const result = await trackConstraints(
				{
					action: 'remove',
					constraint_id: 'budget',
				},
				{ constraints }
			);

			expect(result.isError).toBeUndefined();
			expect(constraints.has('budget')).toBe(false);
		});
	});

	describe('checking constraints', () => {
		it('should check for conflicts between constraints', async () => {
			constraints.set('speed', {
				description: 'Must be fast',
				type: 'performance',
				priority: 'high',
				status: 'active',
			});
			constraints.set('memory', {
				description: 'Must use minimal memory',
				type: 'resource',
				priority: 'high',
				status: 'active',
			});

			const result = await trackConstraints(
				{ action: 'check' },
				{ constraints }
			);

			expect(result.isError).toBeUndefined();
			const data = JSON.parse(result.content[0].text);
			expect(data.has_conflicts).toBeDefined();
		});
	});
});
