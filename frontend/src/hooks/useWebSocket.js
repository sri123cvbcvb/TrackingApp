import { useState, useEffect, useRef, useCallback } from 'react';
import {
  connectWebSocket,
  subscribe,
  publish,
  disconnectWebSocket,
} from '../services/websocket.js';

/**
 * Custom hook managing the full STOMP WebSocket lifecycle.
 *
 * @param {Object} options
 * @param {string}   options.subscribeDestination   Topic to subscribe to (viewer mode)
 * @param {function} options.onMessage              Callback for incoming messages (viewer mode)
 * @param {boolean}  options.autoConnect            If true, connects immediately on mount
 *
 * @returns {{ isConnected, isConnecting, error, sendLocation, disconnect }}
 */
export function useWebSocket({ subscribeDestination, onMessage, autoConnect = true } = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  const clientRef = useRef(null);
  const subscriptionRef = useRef(null);

  const connect = useCallback(() => {
    setIsConnecting(true);
    setError(null);

    const client = connectWebSocket({
      onConnect: () => {
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);

        // Subscribe to topic if destination provided
        if (subscribeDestination && onMessage) {
          subscriptionRef.current = subscribe(client, subscribeDestination, onMessage);
        }
      },
      onDisconnect: () => {
        setIsConnected(false);
        setIsConnecting(false);
      },
      onError: (err) => {
        setIsConnected(false);
        setIsConnecting(false);
        setError('WebSocket connection failed. Retrying...');
        console.error('[useWebSocket] error:', err);
      },
    });

    clientRef.current = client;
  }, [subscribeDestination, onMessage]);

  /**
   * Sends a location update to /app/location (Sender mode).
   */
  const sendLocation = useCallback((trackingId, latitude, longitude) => {
    if (clientRef.current && isConnected) {
      publish(clientRef.current, '/app/location', {
        trackingId,
        latitude,
        longitude,
      });
    }
  }, [isConnected]);

  const disconnect = useCallback(() => {
    subscriptionRef.current?.unsubscribe();
    disconnectWebSocket(clientRef.current);
    setIsConnected(false);
  }, []);

  useEffect(() => {
    if (autoConnect) connect();
    return () => {
      subscriptionRef.current?.unsubscribe();
      disconnectWebSocket(clientRef.current);
    };
  }, [autoConnect, connect]);

  return { isConnected, isConnecting, error, sendLocation, disconnect };
}
