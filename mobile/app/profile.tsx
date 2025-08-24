import React, { useState, useEffect } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Text } from '~/components/ui/text';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import { useAuth } from '~/lib/auth-context';
import { pickImage } from '~/lib/image-picker';

export default function ProfileScreen() {
    const { user, updateProfile, uploadAvatar, deleteAvatar, changePassword, isLoading, error, logout } = useAuth();
    const [form, setForm] = useState({
        firstname: user?.firstname || '',
        lastname: user?.lastname || '',
        email: user?.email || '',
        username: user?.username || '',
    });
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [avatarFile, setAvatarFile] = useState<any>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (user) {
            setForm({
                firstname: user.firstname || '',
                lastname: user.lastname || '',
                email: user.email || '',
                username: user.username || '',
            });
        }
    }, [user]);

    function handleChange(name: string, value: string) {
        setForm((f) => ({ ...f, [name]: value }));
    }

    function handlePasswordChange(name: string, value: string) {
        setPasswordForm((f) => ({ ...f, [name]: value }));
    }

    async function handleSave() {
        try {
            await updateProfile(form);
            setMessage('Profile updated!');
            setTimeout(() => setMessage(null), 3000);
        } catch (err) {
            setMessage('Failed to update profile');
            setTimeout(() => setMessage(null), 3000);
        }
    }

    async function handleAvatarPick() {
        const picked = await pickImage();
        if (picked) {
            setAvatarFile({
                uri: picked.uri,
                name: picked.name,
                type: picked.type,
            });
            setMessage('Ready to upload avatar');
        } else {
            setMessage('Avatar picker cancelled');
        }
    }

    async function handleAvatarUpload() {
        if (!avatarFile) return;
        try {
            await uploadAvatar(avatarFile);
            setAvatarFile(null);
            setMessage('Avatar updated!');
            setTimeout(() => setMessage(null), 3000);
        } catch (err) {
            setMessage('Failed to upload avatar');
            setTimeout(() => setMessage(null), 3000);
        }
    }

    async function handleAvatarDelete() {
        Alert.alert(
            'Delete Avatar',
            'Are you sure you want to delete your avatar?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteAvatar();
                            setMessage('Avatar deleted!');
                            setTimeout(() => setMessage(null), 3000);
                        } catch (err) {
                            setMessage('Failed to delete avatar');
                            setTimeout(() => setMessage(null), 3000);
                        }
                    },
                },
            ]
        );
    }

    async function handlePasswordSubmit() {
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setMessage('Passwords do not match');
            setTimeout(() => setMessage(null), 3000);
            return;
        }
        
        try {
            await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setShowPasswordForm(false);
            setMessage('Password changed successfully!');
            setTimeout(() => setMessage(null), 3000);
        } catch (err) {
            setMessage('Failed to change password');
            setTimeout(() => setMessage(null), 3000);
        }
    }

    return (
        <ScrollView className='flex-1 bg-secondary/30'>
            <View className='flex-1 items-center p-6'>
                <View className='w-full max-w-sm p-6 rounded-2xl bg-card mb-4'>
                    <Text className='text-2xl font-bold mb-4 text-center'>Profile</Text>
                    
                    {/* Avatar Section */}
                    <View className='items-center mb-6'>
                        <Avatar className='w-24 h-24' alt={user?.username || 'Avatar'}>
                            <AvatarImage source={{ uri: user?.avatar }} />
                            <AvatarFallback>{user?.username?.[0] || 'U'}</AvatarFallback>
                        </Avatar>
                        <View className='flex-row gap-2 mt-3'>
                            <Button variant='outline' size='sm' onPress={handleAvatarPick}>
                                <Text>Pick Image</Text>
                            </Button>
                            {user?.avatar && (
                                <Button variant='outline' size='sm' onPress={handleAvatarDelete}>
                                    <Text>Delete</Text>
                                </Button>
                            )}
                        </View>
                        {avatarFile && (
                            <Button className='mt-2' onPress={handleAvatarUpload} disabled={isLoading}>
                                <Text>Upload Avatar</Text>
                            </Button>
                        )}
                    </View>

                    {/* Profile Form */}
                    <Input
                        placeholder='First Name'
                        value={form.firstname}
                        onChangeText={(v) => handleChange('firstname', v)}
                        className='mb-3'
                    />
                    <Input
                        placeholder='Last Name'
                        value={form.lastname}
                        onChangeText={(v) => handleChange('lastname', v)}
                        className='mb-3'
                    />
                    <Input
                        placeholder='Email'
                        value={form.email}
                        onChangeText={(v) => handleChange('email', v)}
                        keyboardType='email-address'
                        autoCapitalize='none'
                        className='mb-3'
                    />
                    <Input
                        placeholder='Username'
                        value={form.username}
                        onChangeText={(v) => handleChange('username', v)}
                        autoCapitalize='none'
                        className='mb-4'
                    />

                    {error && <Text className='text-red-600 mb-3 text-center'>{error}</Text>}
                    {message && <Text className='text-green-600 mb-3 text-center'>{message}</Text>}

                    <Button onPress={handleSave} disabled={isLoading} className='w-full mb-3'>
                        <Text>{isLoading ? 'Saving...' : 'Save Changes'}</Text>
                    </Button>

                    <Button 
                        onPress={() => setShowPasswordForm(!showPasswordForm)} 
                        variant='outline' 
                        className='w-full mb-3'
                    >
                        <Text>{showPasswordForm ? 'Hide' : 'Change'} Password</Text>
                    </Button>

                    <Button onPress={logout} variant='outline' className='w-full'>
                        <Text>Logout</Text>
                    </Button>
                </View>

                {/* Password Change Form */}
                {showPasswordForm && (
                    <View className='w-full max-w-sm p-6 rounded-2xl bg-card'>
                        <Text className='text-xl font-semibold mb-4 text-center'>Change Password</Text>
                        <Input
                            placeholder='Current Password'
                            value={passwordForm.currentPassword}
                            onChangeText={(v) => handlePasswordChange('currentPassword', v)}
                            secureTextEntry
                            className='mb-3'
                        />
                        <Input
                            placeholder='New Password'
                            value={passwordForm.newPassword}
                            onChangeText={(v) => handlePasswordChange('newPassword', v)}
                            secureTextEntry
                            className='mb-3'
                        />
                        <Input
                            placeholder='Confirm New Password'
                            value={passwordForm.confirmPassword}
                            onChangeText={(v) => handlePasswordChange('confirmPassword', v)}
                            secureTextEntry
                            className='mb-4'
                        />
                        <Button 
                            onPress={handlePasswordSubmit} 
                            disabled={isLoading || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                            className='w-full'
                        >
                            <Text>{isLoading ? 'Changing...' : 'Change Password'}</Text>
                        </Button>
                    </View>
                )}
            </View>
        </ScrollView>
    );
}
