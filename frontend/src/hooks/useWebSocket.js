import { useEffect, useRef } from 'react';
import { wsService } from '../services/websocket';

/**
 * Subscribe to WebSocket messages from the notification service.
 * @param {(msg: object) => void} onMessage
 */
export function useWebSocket(onMessage) {
  const cbRef = useRef(onMessage);
  cbRef.current = onMessage;

  useEffect(() => {
    const unsub = wsService.subscribe((msg) => cbRef.current?.(msg));
    return unsub;
  }, []);
}