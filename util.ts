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


async function retry<T>(fn: () => Promise<T>, maxTries: number): Promise<T> {
    let tries = 0;
    while (true) {
        try {
            return await fn();
        } catch (error) {
            if (++tries >= maxTries) {
                throw error;
            }
            console.log(`Attempt ${tries} failed. Retrying...`);
        }
    }
}


