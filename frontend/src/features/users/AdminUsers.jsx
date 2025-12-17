import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../api/client';
import { btn, btnSecondary, btnSmall, btnSmallDanger, card, grid2, rowHeader, table, inp } from '../../styles/ui';

function J(t) { try { return JSON.parse(t); } catch { return null; } }

export default function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [editUser, setEditUser] = useState(null); // {id, email, fullName, role}

    async function loadUsers() {
        const r = await apiFetch('/api/users');
        const t = await r.text();
        const d = J(t) ?? [];
        setUsers(Array.isArray(d) ? d : []);
    }

    async function saveUser(e) {
        e.preventDefault();
        if (!editUser) return;
        await apiFetch(`/api/users/${editUser.id}`, {
            method: 'PUT',
            body: JSON.stringify({ email: editUser.email, fullName: editUser.fullName, role: editUser.role })
        });
        setEditUser(null);
        await loadUsers();
    }

    async function deleteUser(id) {
        if (!confirm(`Ștergi user #${id}?`)) return;
        await apiFetch(`/api/users/${id}`, { method: 'DELETE' });
        await loadUsers();
    }

    useEffect(() => { loadUsers(); }, []);

    return (
        <div style={card}>
            <div style={rowHeader}>
                <h3 style={{ margin: 0 }}>Admin – Users</h3>
                <button style={btn} onClick={loadUsers}>Reîncarcă</button>
            </div>

            <table style={table}>
                <thead>
                <tr><th>ID</th><th>username</th><th>email</th><th>fullName</th><th>role</th><th>actions</th></tr>
                </thead>
                <tbody>
                {users.map(u => (
                    <tr key={u.id}>
                        <td>{u.id}</td>
                        <td>{u.username}</td>
                        <td>{u.email || '-'}</td>
                        <td>{u.fullName || '-'}</td>
                        <td>{u.role}</td>
                        <td>
                            <button
                                style={btnSmall}
                                onClick={() => setEditUser({ id: u.id, email: u.email ?? '', fullName: u.fullName ?? '', role: u.role ?? 'CLIENT' })}
                            >
                                Edit
                            </button>{' '}
                            <button style={btnSmallDanger} onClick={() => deleteUser(u.id)}>Delete</button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>

            {editUser && (
                <form onSubmit={saveUser} style={{ ...card, marginTop: 16 }}>
                    <h4>Edit user #{editUser.id}</h4>
                    <div style={grid2}>
                        <div>
                            <label>Email</label>
                            <input value={editUser.email} onChange={e => setEditUser({ ...editUser, email: e.target.value })} style={inp} />
                        </div>
                        <div>
                            <label>Full name</label>
                            <input value={editUser.fullName} onChange={e => setEditUser({ ...editUser, fullName: e.target.value })} style={inp} />
                        </div>
                    </div>
                    <div style={{ marginTop: 8 }}>
                        <label>Role</label>
                        <select value={editUser.role} onChange={e => setEditUser({ ...editUser, role: e.target.value })} style={inp}>
                            <option>CLIENT</option>
                            <option>ADMIN</option>
                        </select>
                    </div>
                    <div style={{ marginTop: 8 }}>
                        <button style={btn}>Salvează</button>{' '}
                        <button type="button" style={btnSecondary} onClick={() => setEditUser(null)}>Renunță</button>
                    </div>
                </form>
            )}
        </div>
    );
}
