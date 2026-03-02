import { describe, it, expect, beforeEach } from 'vitest';
import { searchThoughts } from './index.js';
import { ThoughtData } from '../sequentialthinking/types.js';

describe('search-thoughts', () => {
	let thought_history: ThoughtData[];
	let branches: Record<string, ThoughtData[]>;

	beforeEach(() => {
		thought_history = [
			{
				available_mcp_tools: ['tool1', 'tool2'],
				thought: 'Initial thought about database design',
				thought_number: 1,
				total_thoughts: 3,
				next_thought_needed: true,
			},
			{
				available_mcp_tools: ['tool1', 'tool2'],
				thought: 'Second thought about API endpoints',
				thought_number: 2,
				total_thoughts: 3,
				next_thought_needed: true,
			},
			{
				available_mcp_tools: ['tool1', 'tool2'],
				thought: 'Final thought about database optimization',
				thought_number: 3,
				total_thoughts: 3,
				next_thought_needed: false,
			},
		];
		branches = {};
	});

	describe('basic search', () => {
		it('should find thoughts matching query string', async () => {
			const result = await searchThoughts(
				{ query: 'database', search_in: 'content', branch_id: undefined, case_sensitive: false },
				{ thought_history, branches }
			);

			expect(result.isError).toBeUndefined();
			const data = JSON.parse(result.content[0].text);
			expect(data.results).toHaveLength(2);
			expect(data.results[0].thought).toContain('database');
			expect(data.results[1].thought).toContain('database');
		});

		it('should return empty array when no matches found', async () => {
			const result = await searchThoughts(
				{ query: 'kubernetes', search_in: 'content', branch_id: undefined, case_sensitive: false },
				{ thought_history, branches }
			);

			expect(result.isError).toBeUndefined();
			const data = JSON.parse(result.content[0].text);
			expect(data.results).toHaveLength(0);
		});

		it('should be case insensitive by default', async () => {
			const result = await searchThoughts(
				{ query: 'DATABASE', search_in: 'content', branch_id: undefined, case_sensitive: false },
				{ thought_history, branches }
			);

			expect(result.isError).toBeUndefined();
			const data = JSON.parse(result.content[0].text);
			expect(data.results).toHaveLength(2);
		});

		it('should respect case sensitivity when enabled', async () => {
			const result = await searchThoughts(
				{ query: 'DATABASE', search_in: 'content', branch_id: undefined, case_sensitive: true },
				{ thought_history, branches }
			);

			expect(result.isError).toBeUndefined();
			const data = JSON.parse(result.content[0].text);
			expect(data.results).toHaveLength(0);
		});
	});

	describe('branch search', () => {
		beforeEach(() => {
			branches['feature-branch'] = [
				{
					available_mcp_tools: ['tool1'],
					thought: 'Feature branch thought about caching',
					thought_number: 1,
					total_thoughts: 2,
					next_thought_needed: true,
					branch_id: 'feature-branch',
				},
			];
		});

		it('should search within specific branch when branch_id provided', async () => {
			const result = await searchThoughts(
				{ query: 'caching', search_in: 'content', branch_id: 'feature-branch', case_sensitive: false },
				{ thought_history, branches }
			);

			expect(result.isError).toBeUndefined();
			const data = JSON.parse(result.content[0].text);
			expect(data.results).toHaveLength(1);
			expect(data.results[0].thought).toContain('caching');
		});

		it('should search in main history when branch_id is undefined', async () => {
			const result = await searchThoughts(
				{ query: 'caching', search_in: 'content', branch_id: undefined, case_sensitive: false },
				{ thought_history, branches }
			);

			expect(result.isError).toBeUndefined();
			const data = JSON.parse(result.content[0].text);
			expect(data.results).toHaveLength(0);
		});
	});

	describe('search results', () => {
		it('should include thought_number in results', async () => {
			const result = await searchThoughts(
				{ query: 'database', search_in: 'content', branch_id: undefined, case_sensitive: false },
				{ thought_history, branches }
			);

			const data = JSON.parse(result.content[0].text);
			expect(data.results[0].thought_number).toBeDefined();
			expect(data.results[0].thought_number).toBe(1);
		});

		it('should include match_count showing total matches', async () => {
			const result = await searchThoughts(
				{ query: 'database', search_in: 'content', branch_id: undefined, case_sensitive: false },
				{ thought_history, branches }
			);

			const data = JSON.parse(result.content[0].text);
			expect(data.match_count).toBe(2);
		});

		it('should include total_thoughts_searched', async () => {
			const result = await searchThoughts(
				{ query: 'database', search_in: 'content', branch_id: undefined, case_sensitive: false },
				{ thought_history, branches }
			);

			const data = JSON.parse(result.content[0].text);
			expect(data.total_thoughts_searched).toBe(3);
		});
	});

	describe('edge cases', () => {
		it('should handle empty thought_history gracefully', async () => {
			const result = await searchThoughts(
				{ query: 'test', search_in: 'content', branch_id: undefined, case_sensitive: false },
				{ thought_history: [], branches: {} }
			);

			expect(result.isError).toBeUndefined();
			const data = JSON.parse(result.content[0].text);
			expect(data.results).toHaveLength(0);
			expect(data.match_count).toBe(0);
		});

		it('should handle special regex characters in query', async () => {
			const result = await searchThoughts(
				{ query: 'test.*[abc]', search_in: 'content', branch_id: undefined, case_sensitive: false },
				{ thought_history, branches }
			);

			expect(result.isError).toBeUndefined();
		});

		it('should return error for non-existent branch', async () => {
			const result = await searchThoughts(
				{ query: 'test', search_in: 'content', branch_id: 'non-existent', case_sensitive: false },
				{ thought_history, branches }
			);

			expect(result.isError).toBe(true);
		});
	});
});
