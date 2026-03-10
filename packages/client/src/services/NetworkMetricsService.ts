type MetricsBucket = {
  packets: number;
  bytes: number;
};

type MetricsSummary = Record<string, { packets: number; bytes: number; packetsPerSec: number; kbps: number }>;

export class NetworkMetricsService {
  private readonly enabled: boolean;
  private readonly flushIntervalMs: number;

  private inbound: Map<string, MetricsBucket> = new Map();
  private outbound: Map<string, MetricsBucket> = new Map();

  private rttCount = 0;
  private rttTotal = 0;
  private rttMax = 0;

  private flushTimer: number | null = null;

  constructor() {
    const envEnabled = import.meta.env.VITE_NETWORK_METRICS;
    this.enabled = envEnabled === 'true' || (envEnabled !== 'false' && import.meta.env.DEV);

    const parsedWindow = Number(import.meta.env.VITE_NETWORK_METRICS_WINDOW_MS ?? 5000);
    this.flushIntervalMs = Number.isFinite(parsedWindow) && parsedWindow > 0 ? parsedWindow : 5000;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  start(): void {
    if (!this.enabled || this.flushTimer !== null) return;

    this.flushTimer = window.setInterval(() => {
      this.flush();
    }, this.flushIntervalMs);
  }

  stop(): void {
    if (this.flushTimer === null) return;
    window.clearInterval(this.flushTimer);
    this.flushTimer = null;
  }

  trackInbound(eventName: string, payload: unknown): void {
    if (!this.enabled) return;
    this.record(this.inbound, eventName, payload);
  }

  trackOutbound(eventName: string, payload: unknown): void {
    if (!this.enabled) return;
    this.record(this.outbound, eventName, payload);
  }

  trackRtt(roundTripMs: number): void {
    if (!this.enabled || !Number.isFinite(roundTripMs) || roundTripMs < 0) return;

    this.rttCount += 1;
    this.rttTotal += roundTripMs;
    if (roundTripMs > this.rttMax) this.rttMax = roundTripMs;
  }

  private record(target: Map<string, MetricsBucket>, eventName: string, payload: unknown): void {
    const current = target.get(eventName) ?? { packets: 0, bytes: 0 };
    current.packets += 1;
    current.bytes += this.estimatePayloadBytes(payload);
    target.set(eventName, current);
  }

  private estimatePayloadBytes(payload: unknown): number {
    if (payload === undefined) return 0;
    try {
      return new TextEncoder().encode(JSON.stringify(payload)).length;
    } catch {
      return 0;
    }
  }

  private flush(): void {
    const windowSeconds = this.flushIntervalMs / 1000;
    const inbound = this.toSummary(this.inbound, windowSeconds);
    const outbound = this.toSummary(this.outbound, windowSeconds);
    const avgRttMs = this.rttCount > 0 ? Number((this.rttTotal / this.rttCount).toFixed(1)) : null;
    const maxRttMs = this.rttCount > 0 ? Number(this.rttMax.toFixed(1)) : null;

    console.log('[net-metrics][client]', {
      windowSeconds,
      inbound,
      outbound,
      rtt: {
        samples: this.rttCount,
        avgMs: avgRttMs,
        maxMs: maxRttMs,
      },
    });

    this.inbound = new Map();
    this.outbound = new Map();
    this.rttCount = 0;
    this.rttTotal = 0;
    this.rttMax = 0;
  }

  private toSummary(source: Map<string, MetricsBucket>, windowSeconds: number): MetricsSummary {
    const summary: MetricsSummary = {};
    for (const [eventName, bucket] of source) {
      summary[eventName] = {
        packets: bucket.packets,
        bytes: bucket.bytes,
        packetsPerSec: Number((bucket.packets / windowSeconds).toFixed(2)),
        kbps: Number(((bucket.bytes / 1024) / windowSeconds).toFixed(2)),
      };
    }
    return summary;
  }
}

export const networkMetricsService = new NetworkMetricsService();
