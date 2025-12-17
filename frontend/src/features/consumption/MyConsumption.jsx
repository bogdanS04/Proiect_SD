import React, { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../../api/client';
import { btn, card, inp, rowHeader } from '../../styles/ui';

function safeJson(t) { try { return JSON.parse(t); } catch { return null; } }

export default function MyConsumption() {
    const [devices, setDevices] = useState([]);
    const [deviceId, setDeviceId] = useState('');
    const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [points, setPoints] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    async function loadDevices() {
        const r = await apiFetch('/api/devices/my');
        const t = await r.text();
        const d = safeJson(t) ?? [];
        setDevices(Array.isArray(d) ? d : []);
        if (!deviceId && Array.isArray(d) && d.length) {
            setDeviceId(String(d[0].id));
        }
    }

    async function loadConsumption(e) {
        if (e) e.preventDefault();
        if (!deviceId) { setError('Selectează un device'); return; }
        setLoading(true);
        setError(null);
        setPoints([]);
        const url = `/api/consumption/day?deviceId=${encodeURIComponent(deviceId)}&date=${date}`;
        try {
            const r = await apiFetch(url);
            const t = await r.text();
            if (!r.ok) {
                setError(t || `Eroare ${r.status}`);
            } else {
                const data = safeJson(t) ?? [];
                setPoints(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            setError(err.message || 'Network error');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { loadDevices(); }, []);

    const maxKwh = useMemo(() => {
        return points.reduce((m, p) => Math.max(m, Number(p.kwh || 0)), 0);
    }, [points]);

    return (
        <div style={card}>
            <div style={rowHeader}>
                <h3 style={{ margin: 0 }}>Consum zilnic (histogramă)</h3>
                <button style={btn} onClick={loadConsumption} disabled={loading}>Reîncarcă</button>
            </div>
            <form onSubmit={loadConsumption} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                <select value={deviceId} onChange={e => setDeviceId(e.target.value)} style={inp}>
                    <option value="">-- alege device --</option>
                    {devices.map(d => <option key={d.id} value={d.id}>{d.name} (#{d.id})</option>)}
                </select>
                <input type="date" value={date} max={new Date().toISOString().slice(0, 10)} onChange={e => setDate(e.target.value)} style={inp} />
                <button style={btn} type="submit" disabled={loading || !deviceId}>Vezi consum</button>
            </form>
            {error && <div style={{ color: 'crimson', marginBottom: 8 }}>{error}</div>}
            {!points.length && !error && <div>Nu există date pentru selecția curentă.</div>}
            {points.length > 0 && (
                <div style={{ display: 'grid', gap: 6 }}>
                    {points.map(p => {
                        const value = Number(p.kwh || 0);
                        const width = maxKwh > 0 ? (value / maxKwh) * 100 : 0;
                        return (
                            <div key={p.hour} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ width: 30, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{String(p.hour).padStart(2, '0')}</div>
                                <div style={{ background: '#4f46e5', height: 18, width: `${Math.max(width, 2)}%`, minWidth: 8, borderRadius: 4, transition: 'width 0.2s' }} />
                                <div style={{ width: 70, fontVariantNumeric: 'tabular-nums' }}>{value.toFixed(3)} kWh</div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
