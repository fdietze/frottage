export async function sleepMs(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function timeout<T>(fn: () => Promise<T>, ms: number): Promise<T> {
    let timer: NodeJS.Timeout;

    const timeout = new Promise<T>((_, reject) => {
        timer = setTimeout(() => {
            reject(new Error('Operation timed out'));
        }, ms);
    });

    try {
        return await Promise.race([fn(), timeout]);
    } finally {
        clearTimeout(timer);
    }
}
