export class AsyncMutex {
	private mutex = Promise.resolve();

	runExclusive<T>(fn: () => Promise<T>): Promise<T> {
		const release = this.mutex;
		let resolveRelease: () => void;

		this.mutex = new Promise(resolve => {
			resolveRelease = resolve;
		});

		return release.then(() => fn().finally(() => resolveRelease()));
	}
}
