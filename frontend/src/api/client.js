// Centralized fetch wrapper with Authorization + 401 handling
let getToken = () => null;
let onUnauthorized = () => {};

export function configureApi({ tokenGetter, on401 }) {
    getToken = tokenGetter || (() => null);
    onUnauthorized = on401 || (() => {});
}

export async function apiFetch(url, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    try {
        const res = await fetch(url, { ...options, headers });
        if (res.status === 401) {
            onUnauthorized();
        }
        return res;
    } catch (err) {
        // Network / CORS etc.
        // Re-throw so callers can surface in UI/debug panel
        throw err;
    }
}