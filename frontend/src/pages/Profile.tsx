import { useState } from "react";
import { Layout } from "../components/ui/Layout";
import { Button } from "../components/ui/button";
import { Card, CardHeader, CardContent } from "../components/ui/card";
import { useAuthStore } from "../stores/auth";
import { useAuthGuard } from "../hooks/useAuthGuard";

export default function ProfilePage() {
    const { isAuthenticated, user } = useAuthGuard();
    const { updateProfile, changePassword, isLoading, error } = useAuthStore();
    const [isEditing, setIsEditing] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [profileForm, setProfileForm] = useState({
        email: "",
        username: "",
        firstname: "",
        lastname: "",
    });
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    if (!isAuthenticated) {
        return null; // Will redirect to login
    }

    // Initialize form with user data when starting to edit
    if (isEditing && user && profileForm.email === "") {
        setProfileForm({
            email: user.email || "",
            username: user.username || "",
            firstname: user.firstname || "",
            lastname: user.lastname || "",
        });
    }

    function handleProfileChange(e: React.ChangeEvent<HTMLInputElement>) {
        setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
    }

    function handlePasswordChange(e: React.ChangeEvent<HTMLInputElement>) {
        setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
    }

    async function handleProfileSubmit(e: React.FormEvent) {
        e.preventDefault();
        const result = await updateProfile(profileForm);
        if (result.success) {
            setIsEditing(false);
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            setTimeout(() => setMessage(null), 5000);
        } else {
            setMessage({ type: 'error', text: result.error || 'Failed to update profile' });
        }
    }

    async function handlePasswordSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }

        const result = await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
        if (result.success) {
            setIsChangingPassword(false);
            setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
            setMessage({ type: 'success', text: 'Password changed successfully!' });
            setTimeout(() => setMessage(null), 5000);
        } else {
            setMessage({ type: 'error', text: result.error || 'Failed to change password' });
        }
    }

    function cancelEdit() {
        setIsEditing(false);
        setProfileForm({ email: "", username: "", firstname: "", lastname: "" });
    }

    function cancelPasswordChange() {
        setIsChangingPassword(false);
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    }

    return (
        <Layout>
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
                    <p className="mt-2 text-gray-600">
                        Manage your account information and security settings.
                    </p>
                </div>

                {message && (
                    <div className={`p-4 rounded-md ${message.type === 'success'
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                        {message.text}
                    </div>
                )}

                {/* Profile Information Card */}
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-semibold">Profile Information</h2>
                            {!isEditing && (
                                <Button onClick={() => setIsEditing(true)}>
                                    Edit Profile
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {!isEditing ? (
                            <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{user?.email}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Username</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{user?.username}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">First Name</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{user?.firstname || "Not set"}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Last Name</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{user?.lastname || "Not set"}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Account Status</dt>
                                    <dd className="mt-1">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user?.is_active
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                            }`}>
                                            {user?.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Roles</dt>
                                    <dd className="mt-1">
                                        <div className="flex flex-wrap gap-2">
                                            {user?.roles?.map((role) => (
                                                <span
                                                    key={role.id}
                                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                                >
                                                    {role.name}
                                                </span>
                                            ))}
                                        </div>
                                    </dd>
                                </div>
                            </dl>
                        ) : (
                            <form onSubmit={handleProfileSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={profileForm.email}
                                            onChange={handleProfileChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                                            Username
                                        </label>
                                        <input
                                            type="text"
                                            id="username"
                                            name="username"
                                            value={profileForm.username}
                                            onChange={handleProfileChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="firstname" className="block text-sm font-medium text-gray-700 mb-1">
                                            First Name
                                        </label>
                                        <input
                                            type="text"
                                            id="firstname"
                                            name="firstname"
                                            value={profileForm.firstname}
                                            onChange={handleProfileChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="lastname" className="block text-sm font-medium text-gray-700 mb-1">
                                            Last Name
                                        </label>
                                        <input
                                            type="text"
                                            id="lastname"
                                            name="lastname"
                                            value={profileForm.lastname}
                                            onChange={handleProfileChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                                {error && (
                                    <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                                        {error}
                                    </div>
                                )}
                                <div className="flex gap-3">
                                    <Button
                                        type="submit"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? "Saving..." : "Save Changes"}
                                    </Button>
                                    <Button
                                        type="button"
                                        className="bg-gray-600 hover:bg-gray-700"
                                        onClick={cancelEdit}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        )}
                    </CardContent>
                </Card>

                {/* Security Settings Card */}
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-semibold">Security Settings</h2>
                            {!isChangingPassword && (
                                <Button onClick={() => setIsChangingPassword(true)}>
                                    Change Password
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {!isChangingPassword ? (
                            <div>
                                <p className="text-sm text-gray-600">
                                    Keep your account secure by using a strong password.
                                </p>
                                <div className="mt-4">
                                    <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                                    <dd className="mt-1 text-sm text-gray-900">
                                        {user?.updated_at
                                            ? new Date(user.updated_at).toLocaleDateString()
                                            : "Unknown"
                                        }
                                    </dd>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handlePasswordSubmit} className="space-y-4">
                                <div>
                                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                        Current Password
                                    </label>
                                    <input
                                        type="password"
                                        id="currentPassword"
                                        name="currentPassword"
                                        value={passwordForm.currentPassword}
                                        onChange={handlePasswordChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                        New Password
                                    </label>
                                    <input
                                        type="password"
                                        id="newPassword"
                                        name="newPassword"
                                        value={passwordForm.newPassword}
                                        onChange={handlePasswordChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                        Confirm New Password
                                    </label>
                                    <input
                                        type="password"
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        value={passwordForm.confirmPassword}
                                        onChange={handlePasswordChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                {error && (
                                    <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                                        {error}
                                    </div>
                                )}
                                <div className="flex gap-3">
                                    <Button
                                        type="submit"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? "Changing..." : "Change Password"}
                                    </Button>
                                    <Button
                                        type="button"
                                        className="bg-gray-600 hover:bg-gray-700"
                                        onClick={cancelPasswordChange}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
}
