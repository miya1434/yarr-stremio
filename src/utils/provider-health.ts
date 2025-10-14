

interface ProviderHealth {
  name: string;
  status: "healthy" | "degraded" | "down";
  lastChecked: Date;
  lastSuccess: Date | null;
  successRate: number; // 0-100
  averageResponseTime: number; // ms
  failureCount: number;
  successCount: number;
}

class ProviderHealthMonitor {
  private health: Map<string, ProviderHealth>;
  private readonly CHECK_INTERVAL = 10 * 60 * 1000; // 10 minutes
  private readonly FAILURE_THRESHOLD = 3; // Disable after 3 consecutive failures
  private intervalId: NodeJS.Timeout | null = null;

  constructor() {
    this.health = new Map();
  }

  /**
   * THIS IS ALL BEING WORKED ON WILL FIGURE OUT A BETTER WAY TO DISPLAY AND IMPLEMENT ON MAIN DASH
   */
  recordResult(
    providerName: string,
    success: boolean,
    responseTime: number
  ): void {
    let health = this.health.get(providerName);

    if (!health) {
      health = {
        name: providerName,
        status: "healthy",
        lastChecked: new Date(),
        lastSuccess: success ? new Date() : null,
        successRate: 100,
        averageResponseTime: responseTime,
        failureCount: 0,
        successCount: 0,
      };
      this.health.set(providerName, health);
    }

    health.lastChecked = new Date();

    if (success) {
      health.successCount++;
      health.failureCount = 0; // Reset failure counter on success
      health.lastSuccess = new Date();
      health.status = "healthy";

      // Update average response time (exponential moving average)
      health.averageResponseTime =
        health.averageResponseTime * 0.7 + responseTime * 0.3;
    } else {
      health.failureCount++;

      if (health.failureCount >= this.FAILURE_THRESHOLD) {
        health.status = "down";
        console.warn(`⚠️ Provider ${providerName} marked as DOWN after ${health.failureCount} failures`);
      } else if (health.failureCount > 1) {
        health.status = "degraded";
      }
    }

    // Update success rate
    const total = health.successCount + health.failureCount;
    health.successRate = total > 0 ? (health.successCount / total) * 100 : 0;
  }

  /**
   * Get health status for a provider
   */
  getHealth(providerName: string): ProviderHealth | null {
    return this.health.get(providerName) || null;
  }

  /**
   * Get all provider health statuses
   */
  getAllHealth(): ProviderHealth[] {
    return Array.from(this.health.values());
  }

  /**
   * Get only healthy providers (auto-filtering)
   */
  getHealthyProviders(): string[] {
    return Array.from(this.health.entries())
      .filter(([_, health]) => health.status === "healthy")
      .map(([name, _]) => name);
  }

  /**
   * Check if a provider should be used
   */
  shouldUseProvider(providerName: string): boolean {
    const health = this.health.get(providerName);
    if (!health) return true; // Not yet tracked, allow it

    return health.status !== "down";
  }

  /**
   * Get dashboard summary
   */
  getDashboard(): {
    total: number;
    healthy: number;
    degraded: number;
    down: number;
    providers: ProviderHealth[];
  } {
    const providers = this.getAllHealth();

    return {
      total: providers.length,
      healthy: providers.filter((p) => p.status === "healthy").length,
      degraded: providers.filter((p) => p.status === "degraded").length,
      down: providers.filter((p) => p.status === "down").length,
      providers: providers.sort((a, b) => b.successRate - a.successRate),
    };
  }

  /**
   * Reset a provider's health (manual recovery)
   */
  resetProvider(providerName: string): void {
    const health = this.health.get(providerName);
    if (health) {
      health.status = "healthy";
      health.failureCount = 0;
      console.log(`✅ Provider ${providerName} health reset`);
    }
  }

  /**
   * Start periodic health checks (optional)
   */
  startMonitoring(): void {
    if (this.intervalId) return;

    this.intervalId = setInterval(() => {
      this.checkStaleProviders();
    }, this.CHECK_INTERVAL);

    console.log("🏥 Provider health monitoring started");
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Check for providers that haven't been used recently
   */
  private checkStaleProviders(): void {
    const now = new Date();
    const STALE_THRESHOLD = 30 * 60 * 1000; // 30 minutes

    for (const [name, health] of this.health.entries()) {
      const timeSinceCheck = now.getTime() - health.lastChecked.getTime();

      if (timeSinceCheck > STALE_THRESHOLD && health.status === "down") {
        // Auto-retry down providers after 30 minutes
        console.log(`🔄 Auto-retrying provider ${name} after 30 minutes`);
        health.failureCount = 0;
        health.status = "degraded"; // Start as degraded, not healthy
      }
    }
  }

  /**
   * Export health data
   */
  export(): string {
    const data = Array.from(this.health.entries()).map(([name, health]) => ({
      name,
      ...health,
      lastChecked: health.lastChecked.toISOString(),
      lastSuccess: health.lastSuccess?.toISOString() || null,
    }));

    return JSON.stringify(data, null, 2);
  }
}

// Global singleton
export const providerHealth = new ProviderHealthMonitor();

