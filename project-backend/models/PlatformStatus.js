/**
 * Platform health status model
 */
class PlatformStatus {
  constructor({
    name,
    displayName,
    status = 'unknown',
    latency = null,
    lastChecked = null,
    error = null,
    itemCount = 0,
  }) {
    this.name = name;
    this.displayName = displayName;
    this.status = status; // 'healthy', 'unhealthy', 'degraded', 'unknown'
    this.latency = latency;
    this.lastChecked = lastChecked || new Date().toISOString();
    this.error = error;
    this.itemCount = itemCount;
  }

  static STATUSES = {
    HEALTHY: 'healthy',
    UNHEALTHY: 'unhealthy',
    DEGRADED: 'degraded',
    UNKNOWN: 'unknown',
  };

  isHealthy() {
    return this.status === PlatformStatus.STATUSES.HEALTHY;
  }

  toJSON() {
    return {
      name: this.name,
      displayName: this.displayName,
      status: this.status,
      latency: this.latency,
      lastChecked: this.lastChecked,
      error: this.error,
      itemCount: this.itemCount,
    };
  }
}

export default PlatformStatus;
