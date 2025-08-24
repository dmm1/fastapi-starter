import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Text } from '~/components/ui/text';
import { useAuth } from '~/lib/auth-context';

export default function RegisterScreen() {
    const { register, login, isLoading, error } = useAuth();
    const router = useRouter();
    const [form, setForm] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        username: '',
        firstname: '',
        lastname: '',
    });
    const [message, setMessage] = useState<string | null>(null);

    function handleChange(name: string, value: string) {
        setForm((f) => ({ ...f, [name]: value }));
    }

    async function handleRegister() {
        if (form.password !== form.confirmPassword) {
            setMessage('Passwords do not match');
            setTimeout(() => setMessage(null), 3000);
            return;
        }

        if (!form.email || !form.password) {
            setMessage('Email and password are required');
            setTimeout(() => setMessage(null), 3000);
            return;
        }

        try {
            await register(
                form.email,
                form.password,
                form.username || undefined,
                form.firstname || undefined,
                form.lastname || undefined
            );
            
            // Auto-login after successful registration
            await login(form.email, form.password);
            router.replace('/');
        } catch (err) {
            // Error handling is done in the auth context
        }
    }

    return (
        <ScrollView className='flex-1 bg-secondary/30'>
            <View className='flex-1 justify-center items-center p-6'>
                <View className='w-full max-w-sm p-6 rounded-2xl bg-card'>
                    <Text className='text-2xl font-bold mb-4 text-center'>Create Account</Text>
                    
                    <Input
                        placeholder='Email *'
                        value={form.email}
                        onChangeText={(v) => handleChange('email', v)}
                        autoCapitalize='none'
                        keyboardType='email-address'
                        className='mb-3'
                    />
                    
                    <Input
                        placeholder='Username (optional)'
                        value={form.username}
                        onChangeText={(v) => handleChange('username', v)}
                        autoCapitalize='none'
                        className='mb-3'
                    />
                    
                    <Input
                        placeholder='First Name (optional)'
                        value={form.firstname}
                        onChangeText={(v) => handleChange('firstname', v)}
                        className='mb-3'
                    />
                    
                    <Input
                        placeholder='Last Name (optional)'
                        value={form.lastname}
                        onChangeText={(v) => handleChange('lastname', v)}
                        className='mb-3'
                    />
                    
                    <Input
                        placeholder='Password *'
                        value={form.password}
                        onChangeText={(v) => handleChange('password', v)}
                        secureTextEntry
                        className='mb-3'
                    />
                    
                    <Input
                        placeholder='Confirm Password *'
                        value={form.confirmPassword}
                        onChangeText={(v) => handleChange('confirmPassword', v)}
                        secureTextEntry
                        className='mb-4'
                    />

                    {error && <Text className='text-red-600 mb-3 text-center'>{error}</Text>}
                    {message && <Text className='text-red-600 mb-3 text-center'>{message}</Text>}

                    <Button 
                        onPress={handleRegister} 
                        disabled={isLoading} 
                        className='w-full mb-3'
                    >
                        <Text>{isLoading ? 'Creating Account...' : 'Create Account'}</Text>
                    </Button>

                    <Button 
                        onPress={() => router.back()} 
                        variant='outline' 
                        className='w-full'
                    >
                        <Text>Back to Login</Text>
                    </Button>
                </View>
            </View>
        </ScrollView>
    );
}