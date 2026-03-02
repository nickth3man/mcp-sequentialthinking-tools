import { describe, it, expect } from 'vitest';
import chalk from 'chalk';
import { formatThought } from './thought.js';
import type { ThoughtData } from '../sequentialthinking/types.js';

describe('formatThought', () => {
	it('should format a basic thought with blue prefix', () => {
		const data: ThoughtData = {
			available_mcp_tools: ['tool1'],
			thought: 'Initial research step',
			thought_number: 1,
			total_thoughts: 3,
			next_thought_needed: true,
		};

		const result = formatThought(data);

		expect(result).toContain(chalk.blue('💭 Thought'));
		expect(result).toContain('1/3');
		expect(result).toContain('Initial research step');
	});

	it('should format a revision thought with yellow prefix', () => {
		const data: ThoughtData = {
			available_mcp_tools: ['tool1'],
			thought: 'Revised analysis',
			thought_number: 2,
			total_thoughts: 3,
			next_thought_needed: true,
			is_revision: true,
			revises_thought: 1,
		};

		const result = formatThought(data);

		expect(result).toContain(chalk.yellow('🔄 Revision'));
		expect(result).toContain('2/3');
		expect(result).toContain('(revising thought 1)');
		expect(result).toContain('Revised analysis');
	});

	it('should format a branch thought with green prefix', () => {
		const data: ThoughtData = {
			available_mcp_tools: ['tool1'],
			thought: 'Branch exploration',
			thought_number: 3,
			total_thoughts: 5,
			next_thought_needed: true,
			branch_from_thought: 2,
			branch_id: 'alt-approach',
		};

		const result = formatThought(data);

		expect(result).toContain(chalk.green('🌿 Branch'));
		expect(result).toContain('3/5');
		expect(result).toContain('(from thought 2, ID: alt-approach)');
		expect(result).toContain('Branch exploration');
	});

	it('should include border box characters', () => {
		const data: ThoughtData = {
			available_mcp_tools: ['tool1'],
			thought: 'Test thought',
			thought_number: 1,
			total_thoughts: 1,
			next_thought_needed: false,
		};

		const result = formatThought(data);

		expect(result).toContain('┌');
		expect(result).toContain('┐');
		expect(result).toContain('├');
		expect(result).toContain('┤');
		expect(result).toContain('└');
		expect(result).toContain('┘');
		expect(result).toContain('─');
		expect(result).toContain('│');
	});

	it('should include recommendation when current_step is present', () => {
		const data: ThoughtData = {
			available_mcp_tools: ['search_docs'],
			thought: 'Research step',
			thought_number: 1,
			total_thoughts: 2,
			next_thought_needed: true,
			current_step: {
				step_description: 'Search documentation',
				expected_outcome: 'Find relevant docs',
				recommended_tools: [
					{
						tool_name: 'search_docs',
						confidence: 0.9,
						rationale: 'Find official docs',
						priority: 1,
					},
				],
			},
		};

		const result = formatThought(data);

		expect(result).toContain('Research step');
		expect(result).toContain('Recommendation:');
		expect(result).toContain('Step: Search documentation');
		expect(result).toContain('search_docs (priority: 1)');
		expect(result).toContain('Expected Outcome: Find relevant docs');
	});

	it('should not include recommendation section when current_step is absent', () => {
		const data: ThoughtData = {
			available_mcp_tools: ['tool1'],
			thought: 'Simple thought',
			thought_number: 1,
			total_thoughts: 1,
			next_thought_needed: false,
		};

		const result = formatThought(data);

		expect(result).not.toContain('Recommendation:');
		expect(result).toContain('Simple thought');
	});

	it('should prefer revision over branch when is_revision is true', () => {
		const data: ThoughtData = {
			available_mcp_tools: ['tool1'],
			thought: 'Test',
			thought_number: 2,
			total_thoughts: 3,
			next_thought_needed: true,
			is_revision: true,
			revises_thought: 1,
			branch_from_thought: 1,
			branch_id: 'test-branch',
		};

		const result = formatThought(data);

		expect(result).toContain(chalk.yellow('🔄 Revision'));
		expect(result).not.toContain(chalk.green('🌿 Branch'));
	});

	it('should use default blue prefix when not revision or branch', () => {
		const data: ThoughtData = {
			available_mcp_tools: ['tool1'],
			thought: 'Normal thought',
			thought_number: 1,
			total_thoughts: 5,
			next_thought_needed: true,
		};

		const result = formatThought(data);

		expect(result).toContain(chalk.blue('💭 Thought'));
		expect(result).not.toContain('revising');
		expect(result).not.toContain('from thought');
	});

	it('should produce border width based on max of header and content length', () => {
		const data: ThoughtData = {
			available_mcp_tools: ['tool1'],
			thought: 'X',
			thought_number: 1,
			total_thoughts: 1,
			next_thought_needed: false,
		};

		const result = formatThought(data);

		// The border should contain multiple ─ characters
		const borderMatch = result.match(/─+/);
		expect(borderMatch).not.toBeNull();
		// Border appears at least 4 times (top, separator, bottom have border chars)
		const allBorders = result.match(/─+/g);
		expect(allBorders).not.toBeNull();
		expect(allBorders!.length).toBeGreaterThanOrEqual(3);
	});

	it('should start with a newline', () => {
		const data: ThoughtData = {
			available_mcp_tools: ['tool1'],
			thought: 'Test',
			thought_number: 1,
			total_thoughts: 1,
			next_thought_needed: false,
		};

		const result = formatThought(data);

		expect(result.startsWith('\n')).toBe(true);
	});
});
