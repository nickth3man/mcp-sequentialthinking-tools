#!/usr/bin/env node

// adapted from https://github.com/modelcontextprotocol/servers/blob/main/src/sequentialthinking/index.ts
// for use with mcp tools

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	SEQUENTIAL_THINKING_TOOL,
	SEQUENTIAL_THINKING_INPUT_SCHEMA,
} from './tools/sequentialthinking/schema.js';
import {
	BRANCH_EXPLORER_TOOL,
	BRANCH_EXPLORER_INPUT_SCHEMA,
} from './tools/branch-explorer/schema.js';
import { ToolAwareSequentialThinkingServer } from './server/index.js';
import {
	ADD_THOUGHT_TOOL,
	ADD_THOUGHT_INPUT_SCHEMA,
} from './tools/add-thought/schema.js';
import {
	GET_THOUGHT_HISTORY_TOOL,
	GET_THOUGHT_HISTORY_INPUT_SCHEMA,
} from './tools/get-thought-history/schema.js';
import {
	CREATE_BRANCH_TOOL,
	CREATE_BRANCH_INPUT_SCHEMA,
} from './tools/create-branch/schema.js';
import {
	LIST_BRANCHES_TOOL,
	LIST_BRANCHES_INPUT_SCHEMA,
} from './tools/list-branches/schema.js';
import {
	COMPARE_BRANCHES_TOOL,
	COMPARE_BRANCHES_INPUT_SCHEMA,
} from './tools/compare-branches/schema.js';
import {
	RECOMMEND_BRANCH_TOOL,
	RECOMMEND_BRANCH_INPUT_SCHEMA,
} from './tools/recommend-branch/schema.js';
import {
	MERGE_BRANCH_INSIGHTS_TOOL,
	MERGE_BRANCH_INSIGHTS_INPUT_SCHEMA,
} from './tools/merge-branch-insights/schema.js';
import {
	SEARCH_THOUGHTS_TOOL,
	SEARCH_THOUGHTS_INPUT_SCHEMA,
} from './tools/search-thoughts/schema.js';
import {
	VALIDATE_THINKING_TOOL,
	VALIDATE_THINKING_INPUT_SCHEMA,
} from './tools/validate-thinking/schema.js';
import {
	SUMMARIZE_THOUGHTS_TOOL,
	SUMMARIZE_THOUGHTS_INPUT_SCHEMA,
} from './tools/summarize-thoughts/schema.js';
import {
	TRACK_CONSTRAINTS_TOOL,
	TRACK_CONSTRAINTS_INPUT_SCHEMA,
} from './tools/track-constraints/schema.js';
import {
	EXTRACT_ACTION_ITEMS_TOOL,
	EXTRACT_ACTION_ITEMS_INPUT_SCHEMA,
} from './tools/extract-action-items/schema.js';

// Get version from package.json
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const package_json = JSON.parse(
	readFileSync(join(__dirname, '../package.json'), 'utf-8'),
);
const { name, version } = package_json;

// Read configuration from environment variables or command line args
const maxHistorySize = parseInt(process.env.MAX_HISTORY_SIZE || '1000');
const maxHeapBytes = parseInt(
	process.env.MAX_HEAP_BYTES || '536870912',
); // Default 512MB
const maxBranches = parseInt(process.env.MAX_BRANCHES || '100');
const maxBranchSize = parseInt(process.env.MAX_BRANCH_SIZE || '500');

const thinkingServer = new ToolAwareSequentialThinkingServer({
	available_tools: [], // TODO: Add tool discovery mechanism
	maxHistorySize,
	maxHeapBytes,
	maxBranches,
	maxBranchSize,
});

// Create MCP server with official SDK
const server = new McpServer({
	name,
	version,
});

// Register the sequential thinking tool
server.registerTool(
	'sequentialthinking_tools',
	{
		description: SEQUENTIAL_THINKING_TOOL.description,
		inputSchema: SEQUENTIAL_THINKING_INPUT_SCHEMA,
	},
	async (
		input: Parameters<
			ToolAwareSequentialThinkingServer['processThought']
		>[0],
	) => {
		return thinkingServer.processThought(input);
	},
);

// Register the branch explorer tool
server.registerTool(
	'branch_explorer',
	{
		description: BRANCH_EXPLORER_TOOL.description,
		inputSchema: BRANCH_EXPLORER_INPUT_SCHEMA,
	},
	async (
		input: Parameters<
			ToolAwareSequentialThinkingServer['processBranchExplorer']
		>[0],
	) => {
		return thinkingServer.processBranchExplorer(input);
	},
);

// Register the add_thought tool
server.registerTool(
	'add_thought',
	{
		description: ADD_THOUGHT_TOOL.description,
		inputSchema: ADD_THOUGHT_INPUT_SCHEMA,
	},
	async (
		input: Parameters<
			ToolAwareSequentialThinkingServer['addThought']
		>[0],
	) => {
		return thinkingServer.addThought(input);
	},
);

// Register the get_thought_history tool
server.registerTool(
	'get_thought_history',
	{
		description: GET_THOUGHT_HISTORY_TOOL.description,
		inputSchema: GET_THOUGHT_HISTORY_INPUT_SCHEMA,
	},
	async (
		input: Parameters<
			ToolAwareSequentialThinkingServer['getThoughtHistory']
		>[0],
	) => {
		return thinkingServer.getThoughtHistory(input);
	},
);

// Register the create_branch tool
server.registerTool(
	'create_branch',
	{
		description: CREATE_BRANCH_TOOL.description,
		inputSchema: CREATE_BRANCH_INPUT_SCHEMA,
	},
	async (
		input: Parameters<
			ToolAwareSequentialThinkingServer['createBranch']
		>[0],
	) => {
		return thinkingServer.createBranch(input);
	},
);

// Register the list_branches tool
server.registerTool(
	'list_branches',
	{
		description: LIST_BRANCHES_TOOL.description,
		inputSchema: LIST_BRANCHES_INPUT_SCHEMA,
	},
	async (
		input: Parameters<
			ToolAwareSequentialThinkingServer['listBranches']
		>[0],
	) => {
		return thinkingServer.listBranches(input);
	},
);

// Register the compare_branches tool
server.registerTool(
	'compare_branches',
	{
		description: COMPARE_BRANCHES_TOOL.description,
		inputSchema: COMPARE_BRANCHES_INPUT_SCHEMA,
	},
	async (
		input: Parameters<
			ToolAwareSequentialThinkingServer['compareBranches']
		>[0],
	) => {
		return thinkingServer.compareBranches(input);
	},
);

// Register the recommend_branch tool
server.registerTool(
	'recommend_branch',
	{
		description: RECOMMEND_BRANCH_TOOL.description,
		inputSchema: RECOMMEND_BRANCH_INPUT_SCHEMA,
	},
	async (
		input: Parameters<
			ToolAwareSequentialThinkingServer['recommendBranch']
		>[0],
	) => {
		return thinkingServer.recommendBranch(input);
	},
);

// Register the merge_branch_insights tool
server.registerTool(
	'merge_branch_insights',
	{
		description: MERGE_BRANCH_INSIGHTS_TOOL.description,
		inputSchema: MERGE_BRANCH_INSIGHTS_INPUT_SCHEMA,
	},
	async (
		input: Parameters<
			ToolAwareSequentialThinkingServer['mergeBranchInsights']
		>[0],
	) => {
		return thinkingServer.mergeBranchInsights(input);
	},
);

// Register the search_thoughts tool
server.registerTool(
	'search_thoughts',
	{
		description: SEARCH_THOUGHTS_TOOL.description,
		inputSchema: SEARCH_THOUGHTS_INPUT_SCHEMA,
	},
	async (
		input: Parameters<
			ToolAwareSequentialThinkingServer['searchThoughts']
		>[0],
	) => {
		return thinkingServer.searchThoughts(input);
	},
);

// Register the validate_thinking tool
server.registerTool(
	'validate_thinking',
	{
		description: VALIDATE_THINKING_TOOL.description,
		inputSchema: VALIDATE_THINKING_INPUT_SCHEMA,
	},
	async (
		input: Parameters<
			ToolAwareSequentialThinkingServer['validateThinking']
		>[0],
	) => {
		return thinkingServer.validateThinking(input);
	},
);

// Register the summarize_thoughts tool
server.registerTool(
	'summarize_thoughts',
	{
		description: SUMMARIZE_THOUGHTS_TOOL.description,
		inputSchema: SUMMARIZE_THOUGHTS_INPUT_SCHEMA,
	},
	async (
		input: Parameters<
			ToolAwareSequentialThinkingServer['summarizeThoughts']
		>[0],
	) => {
		return thinkingServer.summarizeThoughts(input);
	},
);

// Register the track_constraints tool
server.registerTool(
	'track_constraints',
	{
		description: TRACK_CONSTRAINTS_TOOL.description,
		inputSchema: TRACK_CONSTRAINTS_INPUT_SCHEMA,
	},
	async (
		input: Parameters<
			ToolAwareSequentialThinkingServer['trackConstraints']
		>[0],
	) => {
		return thinkingServer.trackConstraints(input);
	},
);

// Register the extract_action_items tool
server.registerTool(
	'extract_action_items',
	{
		description: EXTRACT_ACTION_ITEMS_TOOL.description,
		inputSchema: EXTRACT_ACTION_ITEMS_INPUT_SCHEMA,
	},
	async (
		input: Parameters<
			ToolAwareSequentialThinkingServer['extractActionItems']
		>[0],
	) => {
		return thinkingServer.extractActionItems(input);
	},
);

async function main() {
	const transport = new StdioServerTransport();
	await server.connect(transport);
	console.error('Sequential Thinking MCP Server running on stdio');
}

main().catch((error) => {
	console.error('Fatal error running server:', error);
	process.exit(1);
});
