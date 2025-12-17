import React from 'react';
import { btnSecondary, card } from '../styles/ui';
import { useAuth } from '../auth/AuthContext';

export default function ProfileCard() {
    const { claims, role, logout } = useAuth();
    return (
        <div style={card}>
            <h3>Profil</h3>
            <div><b>username:</b> {claims?.username}</div>
            <div><b>role:</b> {role}</div>
            <div style={{ marginTop: 8 }}>
                <button style={btnSecondary} onClick={logout}>Logout</button>
            </div>
        </div>
    );
}
