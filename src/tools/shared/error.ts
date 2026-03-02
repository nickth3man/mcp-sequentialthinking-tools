export interface ErrorResponse {
	content: Array<{ type: 'text'; text: string }>;
	isError: true;
	[x: string]: unknown;
}

export function formatErrorResponse(error: unknown): ErrorResponse {
	const errorMessage = error instanceof Error ? error.message : String(error);

	return {
		content: [
			{
				type: 'text' as const,
				text: JSON.stringify(
					{
						error: errorMessage,
						status: 'failed',
					},
					null,
					2,
				),
			},
		],
		isError: true,
	};
}
