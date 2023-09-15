export async function sleepMs(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function timeout<T>(
  fn: () => Promise<T>,
  ms: number,
  label?: string,
): Promise<T> {
  let timer: NodeJS.Timeout;

  const timeout = new Promise<T>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`Operation timed out after ${ms}ms (${label})`));
    }, ms);
  });

  try {
    return await Promise.race([fn(), timeout]);
  } finally {
    clearTimeout(timer);
  }
}

export async function retry<T>(
  fn: () => Promise<T>,
  maxTries: number,
  label?: string,
): Promise<T> {
  let tries = 0;
  while (true) {
    try {
      return await fn();
    } catch (error) {
      console.error(error);
      if (++tries >= maxTries) {
        console.log(
          `Attempt ${tries}/${maxTries} failed. Failing (${label})`,
        );
        throw error;
      } else {
        console.log(
          `Attempt ${tries}/${maxTries} failed. Retrying... (${label})`,
        );
      }
    }
  }
}
