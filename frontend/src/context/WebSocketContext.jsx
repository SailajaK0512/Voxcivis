import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useAuth } from './AuthContext';

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [lastEvent, setLastEvent] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);
  const listenersRef = useRef([]);

  useEffect(() => {
    let ws;
    let reconnectTimeout;

    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      // Connect to channel based on user role or fallback to 'all'
      let channel = 'all';
      if (user?.role === 'admin') channel = 'admin';
      else if (user?.role === 'worker' && user?.department_id) channel = `dept_${user.department_id}`;
      else if (user?.role === 'citizen' && user?.id) channel = `user_${user.id}`;

      ws = new WebSocket(`${protocol}//${host}/ws?channel=${channel}`);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastEvent(data);
          listenersRef.current.forEach(callback => callback(data));
        } catch (e) {
          console.error("WS Parse error", e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        reconnectTimeout = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      if (ws) ws.close();
    };
  }, [user]);

  const subscribe = (callback) => {
    listenersRef.current.push(callback);
    return () => {
      listenersRef.current = listenersRef.current.filter(cb => cb !== callback);
    };
  };

  return (
    <WebSocketContext.Provider value={{ isConnected, lastEvent, subscribe }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);
