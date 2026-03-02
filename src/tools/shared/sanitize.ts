export function sanitizeBranchId(id: string): string {
  const forbidden = ['__proto__', 'constructor', 'prototype'];
  if (forbidden.includes(id)) {
    throw new Error(`Invalid branch_id: "${id}" is a reserved identifier`);
  }
  if (id.length > 256) {
    throw new Error('branch_id exceeds maximum length of 256 characters');
  }
  return id;
}


/**
 * Sanitize terminal output by removing ANSI escape sequences
 * to prevent injection attacks from user-controlled content
 */
export function sanitizeTerminalOutput(str: string): string {
	// Remove ANSI escape sequences
	return str.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
}