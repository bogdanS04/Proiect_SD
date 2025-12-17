import React, { useState } from 'react';
import { btn, card, inp } from '../../styles/ui';
import { useAuth } from '../../auth/AuthContext';

export default function LoginForm() {
    const { login } = useAuth();
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        await login({ username: e.target.username.value, password: e.target.password.value });
        setLoading(false);
        e.target.reset();
    }

    return (
        <form onSubmit={handleSubmit} style={card}>
            <h3>Login</h3>
            <input name="username" placeholder="user" required style={inp} />
            <input name="password" type="password" placeholder="parola" required style={inp} />
            <button style={btn} disabled={loading}>{loading ? 'Se autentifică…' : 'Autentificare'}</button>
        </form>
    );
}
