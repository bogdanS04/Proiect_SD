import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';

const RealtimeContext = createContext(null);

export function RealtimeProvider({ children }) {
    const { token, isAuthenticated } = useAuth();
    const wsRef = useRef(null);
    const retryRef = useRef(null);
    const [connected, setConnected] = useState(false);
    const [events, setEvents] = useState([]);
    const [lastEvent, setLastEvent] = useState(null);

    useEffect(() => {
        if (!isAuthenticated || !token) {
            if (wsRef.current) wsRef.current.close();
            return;
        }

        const connect = () => {
            const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
            const wsUrl = `${protocol}://${window.location.host}/ws?token=${encodeURIComponent(token)}`;
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => setConnected(true);
            ws.onclose = () => {
                setConnected(false);
                wsRef.current = null;
                retryRef.current = setTimeout(connect, 3000);
            };
            ws.onmessage = (ev) => {
                try {
                    const data = JSON.parse(ev.data);
                    setLastEvent(data);
                    setEvents((prev) => [...prev.slice(-40), data]); // keep last 40
                } catch (err) {
                    console.warn('WS message parse error', err);
                }
            };
            ws.onerror = () => ws.close();
        };

        connect();

        return () => {
            if (retryRef.current) clearTimeout(retryRef.current);
            if (wsRef.current) wsRef.current.close();
        };
    }, [isAuthenticated, token]);

    const value = {
        connected,
        events,
        lastEvent,
    };

    return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function useRealtime() {
    const ctx = useContext(RealtimeContext);
    if (!ctx) throw new Error('useRealtime must be used within <RealtimeProvider>');
    return ctx;
}
