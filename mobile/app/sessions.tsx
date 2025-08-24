import React, { useEffect, useState } from 'react';
import { View, ScrollView } from 'react-native';
import { Button } from '~/components/ui/button';
import { Text } from '~/components/ui/text';
import { useAuth } from '~/lib/auth-context';
import * as api from '~/lib/api-client';

export default function SessionsScreen() {
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();

    async function fetchSessions() {
        setLoading(true);
        setError(null);
        try {
            const data = await api.getSessions();
            setSessions(data);
        } catch (err: any) {
            setError('Failed to load sessions');
        } finally {
            setLoading(false);
        }
    }

    async function handleDeleteSession(id: string) {
        setLoading(true);
        setError(null);
        try {
            await api.deleteSession(id);
            await fetchSessions();
        } catch (err: any) {
            setError('Failed to delete session');
        } finally {
            setLoading(false);
        }
    }

    async function handleDeleteOtherSessions() {
        setLoading(true);
        setError(null);
        try {
            await api.deleteOtherSessions();
            await fetchSessions();
        } catch (err: any) {
            setError('Failed to delete other sessions');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchSessions();
    }, []);

    return (
        <View className='flex-1 p-6 bg-secondary/30'>
            <ScrollView className='w-full max-w-xl mx-auto'>
                <Text className='text-2xl font-bold mb-4 text-center'>Active Sessions</Text>
                {error && <Text className='text-red-600 mb-2'>{error}</Text>}
                {loading && <Text className='mb-2'>Loading...</Text>}
                {sessions.map((session) => (
                    <View key={session.id} className='mb-4 p-4 rounded-lg border bg-card'>
                        <Text className='font-semibold'>Device: {session.user_agent || 'Unknown'}</Text>
                        <Text>IP: {session.ip_address || 'Unknown'}</Text>
                        <Text>Login: {new Date(session.created_at).toLocaleString()}</Text>
                        {session.expires_at && <Text>Expires: {new Date(session.expires_at).toLocaleString()}</Text>}
                        {session.is_current && <Text className='text-green-600'>Current Session</Text>}
                        <Button
                            variant={session.is_current ? 'destructive' : 'outline'}
                            className='mt-2'
                            onPress={() => handleDeleteSession(session.id)}
                            disabled={loading}
                        >
                            <Text>{session.is_current ? 'Logout (Current)' : 'Logout Device'}</Text>
                        </Button>
                    </View>
                ))}
                {sessions.filter(s => !s.is_current).length > 0 && (
                    <Button
                        variant='outline'
                        className='w-full mt-2'
                        onPress={handleDeleteOtherSessions}
                        disabled={loading}
                    >
                        <Text>Logout All Other Devices</Text>
                    </Button>
                )}
            </ScrollView>
        </View>
    );
}
