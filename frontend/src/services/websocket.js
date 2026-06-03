const WS_BASE = process.env.REACT_APP_WS_URL || 'ws://localhost:8000';

class WebSocketService {
  constructor() {
    this.ws = null;
    this.listeners = new Set();
    this.reconnectTid = null;
    this._token = null;
  }

  connect(token) {
    this._token = token;
    if (this.ws?.readyState === WebSocket.OPEN) return;

    try {
      this.ws = new WebSocket(`${WS_BASE}/ws/notifications/?token=${token}`);

      this.ws.onmessage = ({ data }) => {
        try {
          const parsed = JSON.parse(data);
          this.listeners.forEach(cb => cb(parsed));
        } catch { }
      };

      this.ws.onclose = () => {
        this.ws = null;
        this.reconnectTid = setTimeout(() => {
          const access = localStorage.getItem('access_token');
          if (access) this.connect(access);
        }, 5000);
      };

      this.ws.onerror = () => this.ws?.close();
    } catch { }
  }

  disconnect() {
    clearTimeout(this.reconnectTid);
    this.ws?.close();
    this.ws = null;
    this._token = null;
  }

  /** @returns {() => void} unsubscribe function */
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
}

export const wsService = new WebSocketService();