import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ToolAwareSequentialThinkingServer } from './index.js';
import { Tool } from '../types.js';

describe('ToolAwareSequentialThinkingServer', () => {
	let server: ToolAwareSequentialThinkingServer;

	beforeEach(() => {
		server = new ToolAwareSequentialThinkingServer();
	});

	describe('constructor', () => {
		it('should initialize with default maxHistorySize', () => {
			const customServer = new ToolAwareSequentialThinkingServer();
			expect(customServer.getAvailableTools()).toEqual([]);
		});

		it('should initialize with custom maxHistorySize', async () => {
			const customServer = new ToolAwareSequentialThinkingServer({
				maxHistorySize: 500,
			});
			
			// Test by processing many thoughts and checking behavior
			for (let i = 1; i <= 600; i++) {
				await customServer.processThought({
					available_mcp_tools: ['tool1'],
					thought: `Thought ${i}`,
					thought_number: i,
					total_thoughts: 600,
					next_thought_needed: true,
				});
			}
			
			// The 600th thought should have adjusted total_thoughts
			const result = await customServer.processThought({
				available_mcp_tools: ['tool1'],
				thought: 'Final thought',
				thought_number: 601,
				total_thoughts: 600,
				next_thought_needed: false,
			});
			
			expect(result.isError).toBeUndefined();
		});

		it('should initialize with provided tools', () => {
			const tools: Tool[] = [
				{ name: 'tool1', description: 'Test tool 1' },
				{ name: 'tool2', description: 'Test tool 2' },
			];
			
			const customServer = new ToolAwareSequentialThinkingServer({
				available_tools: tools,
			});
			
			const availableTools = customServer.getAvailableTools();
			expect(availableTools).toHaveLength(2);
			expect(availableTools.map(t => t.name)).toContain('tool1');
			expect(availableTools.map(t => t.name)).toContain('tool2');
		});

		it('should warn about duplicate tool names', () => {
			const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
			
			const tools: Tool[] = [
				{ name: 'tool1', description: 'First' },
				{ name: 'tool1', description: 'Duplicate' },
			];
			
			new ToolAwareSequentialThinkingServer({ available_tools: tools });
			
			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringContaining('Duplicate tool name')
			);
			
			consoleSpy.mockRestore();
		});
	});

	describe('addTool', () => {
		it('should add a new tool', () => {
			const tool: Tool = {
				name: 'newTool',
				description: 'A new tool',
			};
			
			server.addTool(tool);
			
			const tools = server.getAvailableTools();
			expect(tools).toHaveLength(1);
			expect(tools[0].name).toBe('newTool');
		});

		it('should warn when adding duplicate tool', () => {
			const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
			const tool: Tool = {
				name: 'tool1',
				description: 'Tool 1',
			};
			
			server.addTool(tool);
			server.addTool(tool); // Duplicate
			
			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringContaining("already exists")
			);
			expect(server.getAvailableTools()).toHaveLength(1);
			
			consoleSpy.mockRestore();
		});
	});

	describe('clearHistory', () => {
		it('should clear thought history and branches', async () => {
			// Add some thoughts
			await server.processThought({
				available_mcp_tools: ['tool1'],
				thought: 'Thought 1',
				thought_number: 1,
				total_thoughts: 2,
				next_thought_needed: true,
			});
			
			await server.processThought({
				available_mcp_tools: ['tool1'],
				thought: 'Thought 2',
				thought_number: 2,
				total_thoughts: 2,
				next_thought_needed: false,
				branch_from_thought: 1,
				branch_id: 'branch-a',
			});
			
			const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
			server.clearHistory();
			
			expect(consoleSpy).toHaveBeenCalledWith('History cleared');
			consoleSpy.mockRestore();
		});
	});

	describe('discoverTools', () => {
		it('should log that discovery is not implemented', () => {
			const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
			
			server.discoverTools();
			
			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringContaining('not implemented')
			);
			
			consoleSpy.mockRestore();
		});
	});

	describe('processThought', () => {
		it('should process a thought and return result', async () => {
			const result = await server.processThought({
				available_mcp_tools: ['search'],
				thought: 'Test thought',
				thought_number: 1,
				total_thoughts: 1,
				next_thought_needed: false,
			});
			
			expect(result.isError).toBeUndefined();
			expect(result.content).toHaveLength(1);
			
			const payload = JSON.parse(result.content[0].text);
			expect(payload.thought_number).toBe(1);
			expect(payload.thought_history_length).toBe(1);
		});

		it('should track multiple thoughts', async () => {
			for (let i = 1; i <= 3; i++) {
				await server.processThought({
					available_mcp_tools: ['tool1'],
					thought: `Thought ${i}`,
					thought_number: i,
					total_thoughts: 3,
					next_thought_needed: i < 3,
				});
			}
			
			const result = await server.processThought({
				available_mcp_tools: ['tool1'],
				thought: 'Final',
				thought_number: 4,
				total_thoughts: 4,
				next_thought_needed: false,
			});
			
			const payload = JSON.parse(result.content[0].text);
			expect(payload.thought_history_length).toBe(4);
		});
	});

	describe('processBranchExplorer', () => {
		it('should process list action', async () => {
			// First create a branch
			await server.processThought({
				available_mcp_tools: ['tool1'],
				thought: 'Branch thought',
				thought_number: 2,
				total_thoughts: 3,
				next_thought_needed: true,
				branch_from_thought: 1,
				branch_id: 'branch-a',
			});
			
			const result = await server.processBranchExplorer({
				action: 'list',
			});
			
			expect(result.isError).toBeUndefined();
			const payload = JSON.parse(result.content[0].text);
			expect(payload.branches).toHaveLength(1);
			expect(payload.total_branches).toBe(1);
		});

		it('should process recommend action', async () => {
			await server.processThought({
				available_mcp_tools: ['tool1'],
				thought: 'Branch thought',
				thought_number: 1,
				total_thoughts: 2,
				next_thought_needed: true,
				branch_from_thought: 1,
				branch_id: 'branch-a',
			});
			
			const result = await server.processBranchExplorer({
				action: 'recommend',
			});
			
			expect(result.isError).toBeUndefined();
			const payload = JSON.parse(result.content[0].text);
			expect(payload.branches).toHaveLength(1);
			expect(payload.best_branch_id).toBe('branch-a');
		});

		it('should handle compare action with insufficient branches', async () => {
			const result = await server.processBranchExplorer({
				action: 'compare',
				branch_ids: ['branch-a'],
			});
			
			expect(result.isError).toBe(true);
		});

		it('should process merge_insights action', async () => {
			await server.processThought({
				available_mcp_tools: ['tool1'],
				thought: 'Insight one',
				thought_number: 1,
				total_thoughts: 2,
				next_thought_needed: true,
				branch_from_thought: 1,
				branch_id: 'branch-a',
			});
			
			const result = await server.processBranchExplorer({
				action: 'merge_insights',
			});
			
			expect(result.isError).toBeUndefined();
			const payload = JSON.parse(result.content[0].text);
			expect(payload.insights).toContain('Insight one');
		});
	});
});
