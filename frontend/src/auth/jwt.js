// JWT helpers: decode + role derivation compatible with your backend
export function decodeJwt(token) {
    try {
        const [, payload] = token.split('.');
        const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
        const pad = base64.length % 4 === 2 ? '==' : base64.length % 4 === 3 ? '=' : base64.length % 4 === 1 ? '===' : '';
        return JSON.parse(atob(base64 + pad));
    } catch {
        return null;
    }
}

export function roleFromClaims(c) {
    if (!c) return 'CLIENT';
    if (typeof c.role === 'string' && c.role) return c.role;
    const arr = Array.isArray(c.authorities)
        ? c.authorities
        : (typeof c.authorities === 'string'
            ? c.authorities.split(',').map(s => s.trim()).filter(Boolean)
            : []);
    const firstRole = arr.find(x => x && x.startsWith('ROLE_'));
    return firstRole ? firstRole.replace('ROLE_', '') : 'CLIENT';
}