import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { apiFetch } from '../../api/client';
import { useRealtime } from '../realtime/RealtimeProvider';
import { btn, card, inp, rowHeader } from '../../styles/ui';

function MessageBubble({ msg, currentUserId }) {
    const sender = (msg.sender || 'bot').toLowerCase();
    const isMine = sender === 'user' && msg.userId === currentUserId;
    const tone = sender === 'admin' ? '#0f766e' : sender === 'ai' ? '#7c3aed' : sender === 'bot' ? '#475569' : '#111';
    return (
        <div style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
            <div style={{
                background: tone,
                color: '#fff',
                padding: '8px 10px',
                borderRadius: 10,
                maxWidth: '80%',
                marginBottom: 8,
                fontSize: 14,
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
            }}>
                <div style={{ opacity: 0.8, fontSize: 12, marginBottom: 2 }}>
                    {sender.toUpperCase()} • {new Date(msg.timestamp || Date.now()).toLocaleTimeString()}
                </div>
                <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
            </div>
        </div>
    );
}

export default function SupportChat() {
    const { claims, role, isAuthenticated } = useAuth();
    const userId = claims?.sub ? String(claims.sub) : null;
    const { lastEvent, connected } = useRealtime();

    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [targetUserId, setTargetUserId] = useState(() => userId || '');

    const title = useMemo(() => role === 'ADMIN' ? 'Chat suport (admin)' : 'Chat suport', [role]);

    async function loadHistory(uid = userId) {
        if (!uid) return;
        try {
            setError(null);
            const qs = role === 'ADMIN' && uid ? `?userId=${encodeURIComponent(uid)}` : '';
            const r = await apiFetch(`/api/support/history${qs}`);
            const t = await r.text();
            const data = (() => { try { return JSON.parse(t); } catch { return []; } })();
            if (r.ok) {
                const arr = Array.isArray(data) ? data : [];
                setMessages(arr.map(m => ({ ...m, userId: uid })));
            } else {
                setError(t || 'Eroare la încărcarea istoricului');
            }
        } catch (err) {
            setError(err.message || 'Network error');
        }
    }

    useEffect(() => {
        if (role === 'ADMIN') {
            setTargetUserId('');
        } else {
            setTargetUserId(userId || '');
        }
    }, [role, userId]);

    useEffect(() => { if (isAuthenticated && targetUserId) loadHistory(targetUserId); }, [isAuthenticated, targetUserId]);

    useEffect(() => {
        if (!lastEvent || lastEvent.type !== 'chat') return;
        const matchTarget = role === 'ADMIN'
            ? (!lastEvent.targetUserId || lastEvent.targetUserId === targetUserId)
            : (!lastEvent.targetUserId || lastEvent.targetUserId === userId);
        if (!matchTarget) return;
        const payload = lastEvent.payload || {};
        const incoming = { ...payload, userId: lastEvent.targetUserId || userId };
        setMessages((prev) => {
            if (incoming.id && prev.some(m => m.id === incoming.id)) return prev; // dedup
            return [...prev, incoming];
        });
    }, [lastEvent, role, targetUserId, userId]);

    async function sendMessage(e) {
        e.preventDefault();
        if (!text.trim()) return;
        setLoading(true);
        setError(null);
        try {
            if (role === 'ADMIN') {
                const r = await apiFetch('/api/support/admin/reply', {
                    method: 'POST',
                    body: JSON.stringify({ userId: targetUserId, text }),
                    headers: { 'Content-Type': 'application/json' }
                });
                if (!r.ok) {
                    const t = await r.text();
                    setError(t || `Eroare ${r.status}`);
                }
            } else {
                const r = await apiFetch('/api/support/messages', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text })
                });
                if (!r.ok) {
                    const t = await r.text();
                    setError(t || `Eroare ${r.status}`);
                }
            }
            setText('');
        } catch (err) {
            setError(err.message || 'Network error');
        } finally {
            setLoading(false);
        }
    }

    if (!isAuthenticated) return null;

    return (
        <div style={card}>
            <div style={rowHeader}>
                <h3 style={{ margin: 0 }}>{title}</h3>
                <div style={{ fontSize: 12, color: connected ? '#16a34a' : '#be123c' }}>
                    {connected ? 'Conectat la websocket' : 'Deconectat'}
                </div>
            </div>

            {role === 'ADMIN' && (
                <div style={{ display: 'flex', gap: 8, margin: '8px 0' }}>
                    <input
                        style={inp}
                        placeholder="userId pentru conversație"
                        value={targetUserId}
                        onChange={e => setTargetUserId(e.target.value)}
                    />
                    <button style={btn} type="button" onClick={() => loadHistory(targetUserId)} disabled={!targetUserId}>Încarcă istoric</button>
                </div>
            )}

            {error && <div style={{ color: 'crimson', marginBottom: 8 }}>{error}</div>}

            <div style={{ border: '1px solid #ddd', borderRadius: 10, padding: 10, height: 260, overflowY: 'auto', background: '#f8fafc' }}>
                {!messages.length && <div style={{ color: '#6b7280' }}>Începe o conversație și mesajele vor apărea aici.</div>}
                {messages.map(msg => (
                    <MessageBubble key={msg.id} msg={msg} currentUserId={userId} />
                ))}
            </div>

            <form onSubmit={sendMessage} style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <input
                    style={{ ...inp, flex: 1 }}
                    placeholder="Scrie mesajul..."
                    value={text}
                    onChange={e => setText(e.target.value)}
                />
                <button style={btn} type="submit" disabled={loading || !text.trim() || (role === 'ADMIN' && !targetUserId)}>
                    Trimite
                </button>
            </form>
        </div>
    );
}
