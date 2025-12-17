import React, { useEffect, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useRealtime } from '../realtime/RealtimeProvider';
import { card, rowHeader } from '../../styles/ui';

export default function OverconsumptionAlerts() {
    const { isAuthenticated } = useAuth();
    const { lastEvent } = useRealtime();
    const [alerts, setAlerts] = useState([]);

    useEffect(() => {
        if (!lastEvent || lastEvent.type !== 'notification') return;
        const payload = lastEvent.payload || {};
        // păstrăm doar cea mai recentă alertă per deviceId
        setAlerts((prev) => {
            const filtered = prev.filter(a => a.deviceId !== payload.deviceId);
            return [payload, ...filtered].slice(0, 5);
        });
    }, [lastEvent]);

    if (!isAuthenticated) return null;

    const dangerStyle = { background: '#fef2f2', border: '1px solid #ef4444', borderRadius: 10, padding: 10 };
    const safeStyle = { background: '#ecfdf3', border: '1px solid #16a34a', borderRadius: 10, padding: 10 };
    const titleStyle = { margin: 0, color: '#0f172a' };
    const cardTone = alerts.length ? { borderColor: '#e5e7eb', background: '#fff' } : {};

    return (
        <div style={{ ...card, ...cardTone }}>
            <div style={rowHeader}>
                <h3 style={titleStyle}>Alerte supraconsum</h3>
                <span style={{ color: '#ef4444', fontSize: 12, fontWeight: 700 }}>
                    {alerts.length ? `${alerts.length} active` : '0'}
                </span>
            </div>
            {!alerts.length && <div style={{ color: '#6b7280' }}>Nu există alerte de supraconsum.</div>}
            {alerts.map((a, idx) => {
                const isNewest = idx === 0;
                const box = isNewest ? dangerStyle : safeStyle;
                const tone = isNewest ? '#991b1b' : '#166534';
                return (
                    <div key={idx} style={{ ...box, marginBottom: 8 }}>
                        <div style={{ fontWeight: 700, color: tone }}>Device #{a.deviceId}</div>
                        <div style={{ fontSize: 13, color: tone }}>
                            Măsurat {Number(a.readingKwh || 0).toFixed(3)} kWh · prag {Number(a.limitKwh || 0).toFixed(3)} kWh
                        </div>
                        <div style={{ fontSize: 12, color: tone }}>
                            Oră total: {Number(a.hourlyTotalKwh || 0).toFixed(3)} kWh · {a.timestamp ? new Date(a.timestamp).toLocaleString() : 'timp necunoscut'}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
