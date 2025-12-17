import React, { useState } from 'react';
import { btn, card, inp } from '../../styles/ui';
import { useAuth } from '../../auth/AuthContext';

export default function RegisterForm() {
    const { register } = useAuth();
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        await register({
            username: e.target.username.value,
            email: e.target.email.value,
            password: e.target.password.value,
            role: e.target.role.value || 'CLIENT'
        });
        setLoading(false);
        e.target.reset();
    }

    return (
        <form onSubmit={handleSubmit} style={card}>
            <h3>Register</h3>
            <input name="username" placeholder="user nou" required style={inp} />
            <input name="email" type="email" placeholder="email" style={inp} />
            <input name="password" type="password" placeholder="parola" required style={inp} />
            <input name="role" defaultValue="CLIENT" style={inp} />
            <button style={btn} disabled={loading}>{loading ? 'Se creează…' : 'Creează cont'}</button>
        </form>
    );
}
