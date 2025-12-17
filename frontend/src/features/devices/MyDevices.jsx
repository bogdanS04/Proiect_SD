import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../api/client';
import { btn, card, rowHeader, inp } from '../../styles/ui';

function J(t) { try { return JSON.parse(t); } catch { return null; } }

export default function MyDevices() {
    const [myDevices, setMyDevices] = useState([]);

    async function loadMyDevices() {
        const r = await apiFetch('/api/devices/my');
        const t = await r.text();
        const d = J(t) ?? [];
        setMyDevices(Array.isArray(d) ? d : []);
    }

    async function addMyDevice(e) {
        e.preventDefault();
        const body = { name: e.target.name.value, description: e.target.description.value };
        await apiFetch('/api/devices/my', { method: 'POST', body: JSON.stringify(body) });
        e.target.reset();
        await loadMyDevices();
    }

    useEffect(() => { loadMyDevices(); }, []);

    return (
        <div style={card}>
            <div style={rowHeader}>
                <h3 style={{ margin: 0 }}>Dispozitivele mele</h3>
                <button style={btn} onClick={loadMyDevices}>Reîncarcă</button>
            </div>
            <ul>
                {myDevices.map(d => <li key={d.id}><b>{d.name}</b> — {d.status} {d.description ? `(${d.description})` : ''}</li>)}
            </ul>
            <form onSubmit={addMyDevice} style={{ marginTop: 12 }}>
                <input name="name" placeholder="Nume device" required style={inp} />
                <input name="description" placeholder="Descriere" style={inp} />
                <button style={btn}>Adaugă</button>
            </form>
        </div>
    );
}
