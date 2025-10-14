/**
 * Centralized error handling for YARR!
 */

export function logScraperError(
  scraperName: string,
  query: string,
  error: any
): void {
  const message = error?.message || error?.toString() || "Unknown error";
  console.error(`[${scraperName}] Error for query "${query}": ${message}`);
}

export function logDebridError(
  serviceName: string,
  operation: string,
  error: any
): void {
  const message = error?.message || error?.toString() || "Unknown error";
  console.error(`[${serviceName}] Error during ${operation}: ${message}`);
}

export function safeJSONParse<T>(data: string, fallback: T): T {
  try {
    return JSON.parse(data);
  } catch (error) {
    return fallback;
  }
}

export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  fallback: T
): Promise<T> {
  const timeout = new Promise<T>((resolve) => {
    setTimeout(() => resolve(fallback), timeoutMs);
  });

  return Promise.race([promise, timeout]);
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) {
      throw error;
    }

    await new Promise((resolve) => setTimeout(resolve, delay));
    return retryWithBackoff(fn, retries - 1, delay * 2);
  }
}

export function cleanOutputObject(obj: any): any {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v != null && v !== undefined)
  );
}

