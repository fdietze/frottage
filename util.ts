export async function sleepMs(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function timeout<T>(fn: () => Promise<T>, ms: number): Promise<T> {
    const timeout = new Promise<T>((_, reject) => {
        setTimeout(() => {
            reject(new Error('Operation timed out'));
        }, ms);
    });

    return Promise.race([fn(), timeout]);
}