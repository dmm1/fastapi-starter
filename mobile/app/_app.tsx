import React from 'react';
import { AuthProvider } from '~/lib/auth-context';
import { Slot } from 'expo-router';

export default function App() {
    return (
        <AuthProvider>
            <Slot />
        </AuthProvider>
    );
}
