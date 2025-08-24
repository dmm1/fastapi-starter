
import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Text } from '~/components/ui/text';
import { useAuth } from '~/lib/auth-context';

export default function LoginScreen() {
    const { login, isLoading, error, isAuthenticated } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    async function handleLogin() {
        await login(email, password);
    }

    React.useEffect(() => {
        if (isAuthenticated) {
            router.replace('/'); // Go to home/profile after login
        }
    }, [isAuthenticated]);

    return (
        <View className='flex-1 justify-center items-center p-6 bg-secondary/30'>
            <View className='w-full max-w-sm p-6 rounded-2xl bg-card'>
                <Text className='text-2xl font-bold mb-4 text-center'>Login</Text>
                <Input
                    placeholder='E-mail'
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize='none'
                    keyboardType='email-address'
                    className='mb-3'
                />
                <Input
                    placeholder='Password'
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    className='mb-3'
                />
                {error && <Text className='text-red-600 mb-2'>{error}</Text>}
                <Button onPress={handleLogin} disabled={isLoading} className='w-full mb-3'>
                    <Text>{isLoading ? 'Logging in...' : 'Login'}</Text>
                </Button>
                
                <Button 
                    onPress={() => router.push('./register')} 
                    variant='outline' 
                    className='w-full'
                >
                    <Text>Create Account</Text>
                </Button>
            </View>
        </View>
    );
}
