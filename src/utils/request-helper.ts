import axios, { AxiosRequestConfig } from "axios";

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
];

export function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

export async function fetchWithTimeout<T>(
  url: string,
  options: AxiosRequestConfig = {},
  timeoutMs: number = 10000
): Promise<T> {
  const config: AxiosRequestConfig = {
    ...options,
    timeout: timeoutMs,
    headers: {
      "User-Agent": getRandomUserAgent(),
      ...options.headers,
    },
  };

  try {
    const response = await axios(url, config);
    return response.data;
  } catch (error: any) {
    if (error.code === "ECONNABORTED") {
      throw new Error(`Request timeout after ${timeoutMs}ms`);
    }
    throw error;
  }
}

export async function fetchWithRetry<T>(
  url: string,
  options: AxiosRequestConfig = {},
  retries: number = 2
): Promise<T> {
  let lastError: any;

  for (let i = 0; i <= retries; i++) {
    try {
      return await fetchWithTimeout<T>(url, options);
    } catch (error) {
      lastError = error;
      if (i < retries) {
        // Exponential backoff: 1s, 2s, 4s
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }
  }

  throw lastError;
}

export async function fetchWithProxyFallback<T>(
  urls: string[],
  options: AxiosRequestConfig = {}
): Promise<T> {
  for (const url of urls) {
    try {
      return await fetchWithTimeout<T>(url, options);
    } catch (error) {
      console.warn(`Failed to fetch from ${url}, trying next...`);
      continue;
    }
  }

  throw new Error(`All ${urls.length} proxy URLs failed`);
}

