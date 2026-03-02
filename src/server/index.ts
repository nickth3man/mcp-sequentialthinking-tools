import { Tool } from '../types.js';
import { ThoughtData } from '../tools/sequentialthinking/types.js';
import { BranchExplorerInput } from '../tools/branch-explorer/types.js';
import { processThought } from '../tools/sequentialthinking/index.js';
import { processBranchExplorer } from '../tools/branch-explorer/index.js';
import { addThought } from '../tools/add-thought/index.js';
import { AddThoughtInput } from '../tools/add-thought/types.js';
import { getThoughtHistory } from '../tools/get-thought-history/index.js';
import { GetThoughtHistoryInput } from '../tools/get-thought-history/types.js';
import { createBranch } from '../tools/create-branch/index.js';
import { CreateBranchInput } from '../tools/create-branch/types.js';
import { listBranches } from '../tools/list-branches/index.js';
import { ListBranchesInput } from '../tools/list-branches/types.js';
import { compareBranches } from '../tools/compare-branches/index.js';
import { CompareBranchesInput } from '../tools/compare-branches/types.js';
import { recommendBranch } from '../tools/recommend-branch/index.js';
import { RecommendBranchInput } from '../tools/recommend-branch/types.js';
import { mergeBranchInsights } from '../tools/merge-branch-insights/index.js';
import { MergeBranchInsightsInput } from '../tools/merge-branch-insights/types.js';
import { checkMemoryPressure } from '../tools/shared/index.js';
import { AsyncMutex } from '../tools/shared/mutex.js';
import { searchThoughts } from '../tools/search-thoughts/index.js';
import { SearchThoughtsInput } from '../tools/search-thoughts/types.js';
import { validateThinking } from '../tools/validate-thinking/index.js';
import { ValidateThinkingInput } from '../tools/validate-thinking/types.js';
import { summarizeThoughts } from '../tools/summarize-thoughts/index.js';
import { SummarizeThoughtsInput } from '../tools/summarize-thoughts/types.js';
import { trackConstraints } from '../tools/track-constraints/index.js';
import { TrackConstraintsInput } from '../tools/track-constraints/types.js';
import { extractActionItems } from '../tools/extract-action-items/index.js';
import { ExtractActionItemsInput } from '../tools/extract-action-items/types.js';

interface ServerOptions {
	available_tools?: Tool[];
	maxHistorySize?: number;
	maxBranches?: number;
	maxBranchSize?: number;
	maxHeapBytes?: number;
}

export class ToolAwareSequentialThinkingServer {
	private thought_history: ThoughtData[] = [];
	private branches: Record<string, ThoughtData[]> = {};
	private available_tools: Map<string, Tool> = new Map();
	private constraints: Map<string, {
		constraint_id: string;
		description: string;
		type: string;
		priority: string;
		status: string;
		thought_number?: number;
	}> = new Map();
	private readonly maxHistorySize: number;
	private readonly maxBranches: number;
	private readonly maxBranchSize: number;
	private readonly maxHeapBytes: number;
	private stateLock = new AsyncMutex();

	public getAvailableTools(): Tool[] {
		return Array.from(this.available_tools.values());
	}

	constructor(options: ServerOptions = {}) {
		this.maxHistorySize = options.maxHistorySize || 1000;
		this.maxBranches = options.maxBranches || 100;
		this.maxBranchSize = options.maxBranchSize || 500;
		this.maxHeapBytes = options.maxHeapBytes || 512 * 1024 * 1024;

		// Always include the sequential thinking tool
		const tools = [...(options.available_tools || [])];

		// Initialize with provided tools
		tools.forEach((tool) => {
			if (this.available_tools.has(tool.name)) {
				console.error(
					`Warning: Duplicate tool name '${tool.name}' - using first occurrence`,
				);
				return;
			}
			this.available_tools.set(tool.name, tool);
		});

		console.error(
			'Available tools:',
			Array.from(this.available_tools.keys()),
		);
	}

	public clearHistory(): void {
		this.thought_history = [];
		this.branches = {};
		console.error('History cleared');
	}

	public addTool(tool: Tool): void {
		if (this.available_tools.has(tool.name)) {
			console.error(`Warning: Tool '${tool.name}' already exists`);
			return;
		}
		this.available_tools.set(tool.name, tool);
		console.error(`Added tool: ${tool.name}`);
	}

	public discoverTools(): void {
		// In a real implementation, this would scan the environment
		// for available MCP tools and add them to available_tools
		console.error(
			'Tool discovery not implemented - manually add tools via addTool()',
		);
	}

	public async processThought(
		input: Parameters<typeof processThought>[0],
	) {
		checkMemoryPressure({ maxHeapBytes: this.maxHeapBytes });
		return this.stateLock.runExclusive(async () => {
			return processThought(input, {
				thought_history: this.thought_history,
				branches: this.branches,
				maxHistorySize: this.maxHistorySize,
				maxBranchSize: this.maxBranchSize,
			});
		});
	}

	// Tool execution removed - the MCP client handles tool execution
	// This server only provides tool recommendations

	public async processBranchExplorer(input: BranchExplorerInput) {
		return processBranchExplorer(input, {
			branches: this.branches,
		});
	}

	public async addThought(input: AddThoughtInput) {
		checkMemoryPressure({ maxHeapBytes: this.maxHeapBytes });
		return this.stateLock.runExclusive(async () => {
			return addThought(input, {
				thought_history: this.thought_history,
				branches: this.branches,
				maxHistorySize: this.maxHistorySize,
				maxBranchSize: this.maxBranchSize,
			});
		});
	}

	public async getThoughtHistory(input: GetThoughtHistoryInput) {
		return getThoughtHistory(input, {
			thought_history: this.thought_history,
		});
	}

	public async createBranch(input: CreateBranchInput) {
		checkMemoryPressure({ maxHeapBytes: this.maxHeapBytes });
		return this.stateLock.runExclusive(async () => {
			return createBranch(input, {
				thought_history: this.thought_history,
				branches: this.branches,
				maxBranches: this.maxBranches,
			});
		});
	}

	public async listBranches(input: ListBranchesInput) {
		return listBranches(input, {
			branches: this.branches,
		});
	}

	public async compareBranches(input: CompareBranchesInput) {
		return compareBranches(input, {
			branches: this.branches,
		});
	}

	public async recommendBranch(input: RecommendBranchInput) {
		return recommendBranch(input, {
			branches: this.branches,
		});
	}

	public async mergeBranchInsights(input: MergeBranchInsightsInput) {
		return this.stateLock.runExclusive(async () => {
			return mergeBranchInsights(input, {
				branches: this.branches,
			});
		});
	}

	public async searchThoughts(input: SearchThoughtsInput) {
		return searchThoughts(input, {
			thought_history: this.thought_history,
			branches: this.branches,
		});
	}

	public async validateThinking(input: ValidateThinkingInput) {
		return validateThinking(input, {
			thought_history: this.thought_history,
		});
	}

	public async summarizeThoughts(input: SummarizeThoughtsInput) {
		return summarizeThoughts(input, {
			thought_history: this.thought_history,
			branches: this.branches,
		});
	}

	public async trackConstraints(input: TrackConstraintsInput) {
		return trackConstraints(input, {
			constraints: this.constraints,
		});
	}

	public async extractActionItems(input: ExtractActionItemsInput) {
		return extractActionItems(input, {
			thought_history: this.thought_history,
			branches: this.branches,
		});
	}
}
