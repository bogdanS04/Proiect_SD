import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../api/client';
import { btn, btnSecondary, btnSmall, btnSmallDanger, card, grid2, rowHeader, table, inp, inpSmall } from '../../styles/ui';

function J(t) { try { return JSON.parse(t); } catch { return null; } }

export default function AdminDevices({ onDebug }) {
    const [devices, setDevices] = useState([]);
    const [newDevice, setNewDevice] = useState({ userAuthId: '', name: '', description: '' });
    const [editDevice, setEditDevice] = useState(null); // {id, name, description, status}
    const [users, setUsers] = useState([]);

    async function loadDevices() {
        const r = await apiFetch('/api/devices');
        const t = await r.text();
        const d = J(t) ?? [];
        setDevices(Array.isArray(d) ? d : []);
        onDebug?.({ status: r.status, body: J(t) ?? t });
    }

    async function addDevice(e) {
        e.preventDefault();
        const body = { userAuthId: Number(newDevice.userAuthId), name: newDevice.name, description: newDevice.description };
        const r = await apiFetch('/api/devices', { method: 'POST', body: JSON.stringify(body) });
        const t = await r.text();
        onDebug?.({ status: r.status, body: J(t) ?? t });
        setNewDevice({ userAuthId: '', name: '', description: '' });
        await loadDevices();
    }

    async function saveDevice(e) {
        e.preventDefault();
        if (!editDevice) return;
        const r = await apiFetch(`/api/devices/${editDevice.id}`, {
            method: 'PUT',
            body: JSON.stringify({
                name: editDevice.name,
                description: editDevice.description,
                status: editDevice.status,
                userAuthId: editDevice.userAuthId ? Number(editDevice.userAuthId) : null
            })
        });
        const t = await r.text();
        onDebug?.({ status: r.status, body: J(t) ?? t });
        setEditDevice(null);
        await loadDevices();
    }

    async function deleteDevice(id) {
        if (!confirm(`Ștergi device #${id}?`)) return;
        const r = await apiFetch(`/api/devices/${id}`, { method: 'DELETE' });
        const t = await r.text();
        onDebug?.({ status: r.status, body: J(t) ?? t });
        await loadDevices();
    }

    async function loadUsers() {
        const r = await apiFetch('/api/users');
        const t = await r.text();
        const d = J(t) ?? [];
        setUsers(Array.isArray(d) ? d : []);
    }

    useEffect(() => {
        loadDevices();
        loadUsers();
    }, []);

    return (
        <div style={card}>
            <div style={rowHeader}>
                <h3 style={{ margin: 0 }}>Admin – Devices</h3>
                <button style={btn} onClick={loadDevices}>Reîncarcă</button>
            </div>

            <form onSubmit={addDevice} style={{ ...rowHeader, gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                <select value={newDevice.userAuthId} onChange={e => setNewDevice({ ...newDevice, userAuthId: e.target.value })} style={inpSmall} required>
                    <option value="">-- select user --</option>
                    {users.map(u => (
                        <option key={u.id} value={u.authId}>{u.username} (#{u.id}, role {u.role})</option>
                    ))}
                </select>
                <input placeholder="name" value={newDevice.name} onChange={e => setNewDevice({ ...newDevice, name: e.target.value })} style={inpSmall} required />
                <input placeholder="description" value={newDevice.description} onChange={e => setNewDevice({ ...newDevice, description: e.target.value })} style={inpSmall} />
                <button style={btn}>Add device</button>
            </form>

            <table style={table}>
                <thead>
                <tr><th>ID</th><th>userAuthId</th><th>name</th><th>status</th><th>actions</th></tr>
                </thead>
                <tbody>
                {devices.map(d => (
                    <tr key={d.id}>
                        <td>{d.id}</td>
                        <td>{d.userAuthId}</td>
                        <td>{d.name}</td>
                        <td>{d.status}</td>
                        <td>
                            <button
                                style={btnSmall}
                                onClick={() => setEditDevice({ id: d.id, name: d.name ?? '', description: d.description ?? '', status: d.status ?? 'ACTIVE', userAuthId: d.userAuthId ?? '' })}
                            >
                                Edit
                            </button>{' '}
                            <button style={btnSmallDanger} onClick={() => deleteDevice(d.id)}>Delete</button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>

            {editDevice && (
                <form onSubmit={saveDevice} style={{ ...card, marginTop: 16 }}>
                    <h4>Edit device #{editDevice.id}</h4>
                    <div style={grid2}>
                        <input value={editDevice.name} onChange={e => setEditDevice({ ...editDevice, name: e.target.value })} style={inp} />
                        <input value={editDevice.description} onChange={e => setEditDevice({ ...editDevice, description: e.target.value })} style={inp} />
                    </div>
                    <div style={{ marginTop: 8 }}>
                        <label>User</label>
                        <select value={editDevice.userAuthId} onChange={e => setEditDevice({ ...editDevice, userAuthId: e.target.value })} style={inp}>
                            <option value="">-- select user --</option>
                            {users.map(u => (
                                <option key={u.id} value={u.authId}>{u.username} (#{u.id}, role {u.role})</option>
                            ))}
                        </select>
                    </div>
                    <div style={{ marginTop: 8 }}>
                        <label>Status</label>
                        <select value={editDevice.status} onChange={e => setEditDevice({ ...editDevice, status: e.target.value })} style={inp}>
                            <option>ACTIVE</option>
                            <option>INACTIVE</option>
                        </select>
                    </div>
                    <div style={{ marginTop: 8 }}>
                        <button style={btn}>Salvează</button>{' '}
                        <button type="button" style={btnSecondary} onClick={() => setEditDevice(null)}>Renunță</button>
                    </div>
                </form>
            )}
        </div>
    );
}
