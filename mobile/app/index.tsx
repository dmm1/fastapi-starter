import { useAuth } from '~/lib/auth-context';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { Button } from '~/components/ui/button';
import { Text } from '~/components/ui/text';
import { Avatar, AvatarImage, AvatarFallback } from '~/components/ui/avatar';

export default function HomeScreen() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();

  return (
    <View className='flex-1 justify-center items-center p-6 bg-secondary/30'>
      {!isAuthenticated ? (
        <View className='w-full max-w-sm p-6 rounded-2xl bg-card items-center'>
          <Text className='text-2xl font-bold mb-4 text-center'>Welcome!</Text>
          <Text className='text-center mb-6 opacity-70'>Sign in to access your profile and manage your account</Text>
          <Button onPress={() => router.push('./login')} className='w-full mb-3'>
            <Text>Sign In</Text>
          </Button>
          <Button onPress={() => router.push('./register')} variant='outline' className='w-full'>
            <Text>Create Account</Text>
          </Button>
        </View>
      ) : (
        <View className='w-full max-w-sm p-6 rounded-2xl bg-card items-center'>
          <Avatar alt={user?.username || 'Avatar'} className='w-24 h-24'>
            <AvatarImage source={{ uri: user?.avatar }} />
            <AvatarFallback>{user?.username?.[0]}</AvatarFallback>
          </Avatar>
          <Text className='text-2xl font-bold mt-4 mb-2'>{user?.firstname || user?.username}</Text>
          <Text className='mb-2'>{user?.email}</Text>
          <Button className='w-full mb-2' onPress={() => router.push('./profile')}>
            <Text>Profile</Text>
          </Button>
          <Button className='w-full' onPress={() => router.push('./sessions')}>
            <Text>Sessions</Text>
          </Button>
        </View>
      )}
    </View>
  );
}
