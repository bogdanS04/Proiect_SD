import React, { useState } from 'react';
import { AuthProvider, useAuth } from './auth/AuthContext';
import ProfileCard from './components/ProfileCard';
import AdminUsers from './features/users/AdminUsers';
import AdminDevices from './features/devices/AdminDevices';
import MyDevices from './features/devices/MyDevices';
import MyConsumption from './features/consumption/MyConsumption';
import LoginForm from './features/auth/LoginForm';
import RegisterForm from './features/auth/RegisterForm';
import OverconsumptionAlerts from './features/notifications/OverconsumptionAlerts';
import SupportChat from './features/support/SupportChat';
import { RealtimeProvider } from './features/realtime/RealtimeProvider';
import { grid2, page } from './styles/ui';

function AppShell() {
    const { isAuthenticated, role } = useAuth();
    const [view, setView] = useState(isAuthenticated ? 'home' : 'auth');

    React.useEffect(() => {
        setView(isAuthenticated ? 'home' : 'auth');
    }, [isAuthenticated]);

    return (
        <div style={page}>
            <h1>Energy Management System</h1>

            {view === 'auth' && (
                <div style={grid2}>
                    <LoginForm />
                    <RegisterForm />
                </div>
            )}

            {view === 'home' && (
                <>
                    <ProfileCard />
                    <OverconsumptionAlerts />
                    <SupportChat />
                    {role === 'ADMIN' ? (
                        <>
                            <AdminUsers />
                            <AdminDevices />
                            <MyConsumption />
                        </>
                    ) : (
                        <>
                            <MyDevices />
                            <MyConsumption />
                        </>
                    )}
                </>
            )}
        </div>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <RealtimeProvider>
                <AppShell />
            </RealtimeProvider>
        </AuthProvider>
    );
}
