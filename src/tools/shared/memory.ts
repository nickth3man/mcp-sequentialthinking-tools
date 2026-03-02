export interface MemoryLimits {
	maxHeapBytes?: number;
}

/**
 * Checks if memory usage exceeds the specified limit.
 * Throws an error if the limit is exceeded.
 */
export function checkMemoryPressure(limits: MemoryLimits = {}): void {
	const maxHeap = limits.maxHeapBytes || 512 * 1024 * 1024; // 512MB default
	const usage = process.memoryUsage();

	if (usage.heapUsed > maxHeap) {
		throw new Error(
			`Memory limit exceeded: ${Math.round(usage.heapUsed / 1024 / 1024)}MB used (limit: ${Math.round(maxHeap / 1024 / 1024)}MB)`,
		);
	}
}

/**
 * Returns current memory usage information.
 */
export function getMemoryUsage(): {
	used: number;
	limit: number;
	percentage: number;
} {
	const maxHeap = 512 * 1024 * 1024;
	const usage = process.memoryUsage();
	return {
		used: usage.heapUsed,
		limit: maxHeap,
		percentage: (usage.heapUsed / maxHeap) * 100,
	};
}
