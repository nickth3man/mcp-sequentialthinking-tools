import { describe, it, expect, beforeEach } from 'vitest';
import { validateThinking } from './index.js';
import { ThoughtData } from '../sequentialthinking/types.js';

describe('validate-thinking', () => {
	let thought_history: ThoughtData[];

	beforeEach(() => {
		thought_history = [];
	});

	describe('basic validation', () => {
		it('should validate a single thought with no issues', async () => {
			thought_history = [
				{
					available_mcp_tools: ['tool1'],
					thought: 'Clear and specific thought about the problem',
					thought_number: 1,
					total_thoughts: 2,
					next_thought_needed: true,
				},
			];

			const result = await validateThinking(
				{ thought_number: 1 },
				{ thought_history }
			);

			expect(result.isError).toBeUndefined();
			const data = JSON.parse(result.content[0].text);
			expect(data.is_valid).toBe(true);
			expect(data.issues).toHaveLength(0);
		});

		it('should detect empty thought', async () => {
			thought_history = [
				{
					available_mcp_tools: ['tool1'],
					thought: '',
					thought_number: 1,
					total_thoughts: 2,
					next_thought_needed: true,
				},
			];

			const result = await validateThinking(
				{ thought_number: 1 },
				{ thought_history }
			);

			const data = JSON.parse(result.content[0].text);
			expect(data.is_valid).toBe(false);
			expect(data.issues.some((i: { type: string }) => i.type === 'empty_content')).toBe(true);
		});

		it('should detect vague language', async () => {
			thought_history = [
				{
					available_mcp_tools: ['tool1'],
					thought: 'Maybe we should do something about the thing',
					thought_number: 1,
					total_thoughts: 2,
					next_thought_needed: true,
				},
			];

			const result = await validateThinking(
				{ thought_number: 1 },
				{ thought_history }
			);

			const data = JSON.parse(result.content[0].text);
			expect(data.issues.some((i: { type: string }) => i.type === 'vague_language')).toBe(true);
		});
	});

	describe('sequence validation', () => {
		it('should detect circular reasoning', async () => {
			thought_history = [
				{
					available_mcp_tools: ['tool1'],
					thought: 'We need X because of Y',
					thought_number: 1,
					total_thoughts: 3,
					next_thought_needed: true,
				},
				{
					available_mcp_tools: ['tool1'],
					thought: 'Y is true because of X',
					thought_number: 2,
					total_thoughts: 3,
					next_thought_needed: true,
				},
			];

			const result = await validateThinking(
				{ thought_number: 2, check_circular: true },
				{ thought_history }
			);

			const data = JSON.parse(result.content[0].text);
			expect(data.issues.some((i: { type: string }) => i.type === 'circular_reasoning')).toBe(true);
		});

		it('should detect gaps in reasoning', async () => {
			thought_history = [
				{
					available_mcp_tools: ['tool1'],
					thought: 'First premise: A equals B',
					thought_number: 1,
					total_thoughts: 3,
					next_thought_needed: true,
				},
				{
					available_mcp_tools: ['tool1'],
					thought: 'Therefore, C equals D',
					thought_number: 2,
					total_thoughts: 3,
					next_thought_needed: true,
				},
			];

			const result = await validateThinking(
				{ thought_number: 2, check_gaps: true },
				{ thought_history }
			);

			const data = JSON.parse(result.content[0].text);
			expect(data.issues.some((i: { type: string }) => i.type === 'reasoning_gap')).toBe(true);
		});
	});

	describe('bias detection', () => {
		it('should detect confirmation bias keywords', async () => {
			thought_history = [
				{
					available_mcp_tools: ['tool1'],
					thought: 'This clearly proves my initial hypothesis was correct',
					thought_number: 1,
					total_thoughts: 2,
					next_thought_needed: true,
				},
			];

			const result = await validateThinking(
				{ thought_number: 1, check_biases: true },
				{ thought_history }
			);

			const data = JSON.parse(result.content[0].text);
			expect(data.issues.some((i: { type: string }) => i.type === 'potential_bias')).toBe(true);
		});
	});

	describe('edge cases', () => {
		it('should return error for non-existent thought number', async () => {
			const result = await validateThinking(
				{ thought_number: 999 },
				{ thought_history }
			);

			expect(result.isError).toBe(true);
		});

		it('should provide suggestions for improvement', async () => {
			thought_history = [
				{
					available_mcp_tools: ['tool1'],
					thought: 'Maybe we could do something',
					thought_number: 1,
					total_thoughts: 2,
					next_thought_needed: true,
				},
			];

			const result = await validateThinking(
				{ thought_number: 1 },
				{ thought_history }
			);

			const data = JSON.parse(result.content[0].text);
			expect(data.suggestions).toBeDefined();
			expect(data.suggestions.length).toBeGreaterThan(0);
		});
	});
});
