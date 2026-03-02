/**
 * Shared types used across the MCP Sequential Thinking server
 */

export interface Tool {
	name: string;
	description: string;
}

export interface ServerConfig {
	available_tools: Map<string, Tool>;
}
