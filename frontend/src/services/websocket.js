import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const WS_URL = import.meta.env.VITE_WS_URL || '/ws';

let stompClient = null;

/**
 * Creates and connects a STOMP client over SockJS.
 *
 * @param {Object} handlers
 * @param {function} handlers.onConnect - Called when STOMP connection is established
 * @param {function} handlers.onDisconnect - Called when connection drops
 * @param {function} handlers.onError - Called on STOMP error
 * @returns {Client} stompClient instance
 */
export const connectWebSocket = ({ onConnect, onDisconnect, onError }) => {
  stompClient = new Client({
    webSocketFactory: () => new SockJS(WS_URL),
    reconnectDelay: 3000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,

    onConnect: (frame) => {
      console.log('[WS] Connected:', frame);
      onConnect?.(frame);
    },

    onDisconnect: () => {
      console.log('[WS] Disconnected');
      onDisconnect?.();
    },

    onStompError: (frame) => {
      console.error('[WS] STOMP error:', frame.headers?.message);
      onError?.(frame);
    },

    onWebSocketError: (event) => {
      console.error('[WS] WebSocket error:', event);
      onError?.(event);
    },
  });

  stompClient.activate();
  return stompClient;
};

/**
 * Subscribes to a STOMP destination.
 *
 * @param {Client} client
 * @param {string} destination  e.g. '/topic/track/ABC123'
 * @param {function} callback   Called with the parsed message body
 * @returns {StompSubscription}
 */
export const subscribe = (client, destination, callback) => {
  return client.subscribe(destination, (message) => {
    try {
      const body = JSON.parse(message.body);
      callback(body);
    } catch (e) {
      console.error('[WS] Failed to parse message:', e);
    }
  });
};

/**
 * Publishes a message to a STOMP destination.
 *
 * @param {Client} client
 * @param {string} destination  e.g. '/app/location'
 * @param {Object} body         Will be JSON-serialized
 */
export const publish = (client, destination, body) => {
  if (client?.connected) {
    client.publish({
      destination,
      body: JSON.stringify(body),
    });
  } else {
    console.warn('[WS] Tried to publish but client is not connected');
  }
};

/**
 * Disconnects the STOMP client gracefully.
 * @param {Client} client
 */
export const disconnectWebSocket = (client) => {
  if (client?.active) {
    client.deactivate();
    console.log('[WS] Client deactivated');
  }
};
