/**
 * Request queue and concurrency control
 */

interface QueueTask<T> {
  id: string;
  method: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: any) => void;
}

export class RequestQueue {
  private pending: Map<string, Promise<any>>;
  private concurrency: number;
  private activeCount: number;

  constructor(concurrency: number = 30) {
    this.pending = new Map();
    this.concurrency = concurrency;
    this.activeCount = 0;
  }

  
  async wrap<T>(id: string, method: () => Promise<T>): Promise<T> {
   
    if (this.pending.has(id)) {
      console.log(`Request ${id} already pending, returning existing promise`);
      return this.pending.get(id) as Promise<T>;
    }

   
    const promise = method()
      .finally(() => {
        this.pending.delete(id);
      });

    this.pending.set(id, promise);
    return promise;
  }

  getPendingCount(): number {
    return this.pending.size;
  }
}


export class ConcurrencyLimiter {
  private limit: number;
  private _activeCount: number;
  private queue: Array<() => void>;

  constructor(concurrency: number) {
    this.limit = concurrency;
    this._activeCount = 0;
    this.queue = [];
  }

  async run<T>(fn: () => Promise<T>): Promise<T> {
    // Wait if at capacity
    if (this._activeCount >= this.limit) {
      await new Promise<void>((resolve) => this.queue.push(resolve));
    }

    this._activeCount++;

    try {
      return await fn();
    } finally {
      this._activeCount--;
      
      // Process next queued item
      const next = this.queue.shift();
      if (next) {
        next();
      }
    }
  }

  get pendingCount(): number {
    return this.queue.length;
  }

  get activeCount(): number {
    return this._activeCount;
  }

  clearQueue(): void {
    this.queue = [];
  }
}

// Global instances
export const streamQueue = new RequestQueue(Infinity); 
export const searchLimiter = new ConcurrencyLimiter(30); 

