import { io, Socket } from 'socket.io-client';
import msgpackParser from 'socket.io-msgpack-parser';
import { networkMetricsService } from './NetworkMetricsService';

class SocketService {
  private socket: Socket | null = null;
  private probeTimer: number | null = null;
  private readonly PROBE_INTERVAL_MS = 2000;

  connect(): Socket {
    if (this.socket?.connected) return this.socket;

    const serverUrl = import.meta.env.VITE_SERVER_URL ?? '';
    this.socket = io(serverUrl, {
      parser: msgpackParser,
      transports: ['websocket'],
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      console.log('[Socket] connected', this.socket?.id);
      networkMetricsService.start();
      this.startProbeLoop();
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('[Socket] disconnected:', reason);
      this.stopProbeLoop();
      networkMetricsService.stop();
    });

    return this.socket;
  }

  getSocket(): Socket {
    if (!this.socket) return this.connect();
    return this.socket;
  }

  disconnect(): void {
    this.stopProbeLoop();
    networkMetricsService.stop();
    this.socket?.disconnect();
    this.socket = null;
  }

  private startProbeLoop(): void {
    if (!this.socket || this.probeTimer !== null) return;
    if (!networkMetricsService.isEnabled()) return;

    this.probeTimer = window.setInterval(() => {
      if (!this.socket?.connected) return;

      const sentAt = performance.now();
      networkMetricsService.trackOutbound('net:probe', { sentAt });

      this.socket.emit('net:probe', sentAt, () => {
        networkMetricsService.trackInbound('net:probe:ack', {});
        networkMetricsService.trackRtt(performance.now() - sentAt);
      });
    }, this.PROBE_INTERVAL_MS);
  }

  private stopProbeLoop(): void {
    if (this.probeTimer === null) return;
    window.clearInterval(this.probeTimer);
    this.probeTimer = null;
  }
}

export const socketService = new SocketService();
