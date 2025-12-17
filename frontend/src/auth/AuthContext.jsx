import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { configureApi } from '../api/client';
import { decodeJwt, roleFromClaims } from './jwt';

const AuthContext = createContext(null);

function safeJson(t) { try { return JSON.parse(t); } catch { return null; } }

export function AuthProvider({ children }) {
    const [token, setToken] = useState(null);
    const [claims, setClaims] = useState(null); // { sub, username, authorities, role, ... }

    // logout handler (also used on 401)
    const logout = useCallback(() => {
        setToken(null);
        setClaims(null);
        localStorage.removeItem('accessToken');
        alert('Sesiunea a expirat sau ai ieșit din cont. Autentifică-te din nou.');
    }, []);

    // Configure API bridge
    useEffect(() => {
        configureApi({
            tokenGetter: () => token,
            on401: logout,
        });
    }, [token, logout]);

    // Restore session from localStorage
    useEffect(() => {
        const t = localStorage.getItem('accessToken');
        if (!t) return;
        const c = decodeJwt(t);
        if (c) {
            const role = roleFromClaims(c);
            setToken(t);
            setClaims({ ...c, username: c?.username, role });
        }
    }, []);

    const value = useMemo(() => ({
        token,
        claims,
        isAuthenticated: Boolean(token && claims),
        role: claims?.role || 'CLIENT',

        async login({ username, password }) {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: username.trim(), password })
            });
            const text = await res.text();
            const data = safeJson(text);
            if (res.ok && data?.accessToken) {
                const c = decodeJwt(data.accessToken);
                const role = roleFromClaims(c);
                setToken(data.accessToken);
                setClaims({ ...c, username: c?.username, role });
                localStorage.setItem('accessToken', data.accessToken);
            }
            return { status: res.status, body: data ?? text };
        },

        async register({ username, email, password, role = 'CLIENT' }) {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: username.trim(), email: email?.trim(), password, role })
            });
            const text = await res.text();
            const data = safeJson(text);
            return { status: res.status, body: data ?? text };
        },

        logout,
    }), [token, claims, logout]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
    return ctx;
}
