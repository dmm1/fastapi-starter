import { useState } from "react";
import {
    User,
    Lock,
    Edit,
    Save,
    X,
    Eye,
    EyeOff
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { AvatarManager } from "../components/AvatarManager";
import { useAuthStore } from "../stores/auth";
import { useAuthGuard } from "../hooks/useAuthGuard";
import { useSessions } from "../hooks/useSessions";

export default function ProfilePage() {
    const { isAuthenticated, user } = useAuthGuard();
    const { updateProfile, changePassword, refreshUser, isLoading, error } = useAuthStore();
    const { sessions, loading: sessionsLoading, error: sessionsError, deleteSession, deleteAllOtherSessions } = useSessions();
    const [isEditing, setIsEditing] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false,
    });
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
    // Sidebar section state
    const [section, setSection] = useState<'profile' | 'security' | 'sessions' | 'activity'>('profile');

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

    function togglePasswordVisibility(field: 'current' | 'new' | 'confirm') {
        setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
    }

    function handleAvatarUpdate() {
        setMessage({ type: 'success', text: 'Avatar updated successfully!' });
        setTimeout(() => setMessage(null), 5000);
        // Refresh user data to get the updated avatar
        refreshUser();
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
        <div className="flex flex-col md:flex-row h-full">
            {/* Sidebar */}
            <aside className="w-full md:w-64 md:min-h-[500px] border-r bg-muted/50 p-6 flex-shrink-0">
                <nav className="flex flex-row md:flex-col gap-2">
                    <button
                        className={`text-left px-4 py-2 rounded font-medium transition-colors ${section === 'profile' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
                        onClick={() => setSection('profile')}
                    >
                        Profile
                    </button>
                    <button
                        className={`text-left px-4 py-2 rounded font-medium transition-colors ${section === 'security' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
                        onClick={() => setSection('security')}
                    >
                        Security
                    </button>
                    <button
                        className={`text-left px-4 py-2 rounded font-medium transition-colors ${section === 'sessions' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
                        onClick={() => setSection('sessions')}
                    >
                        Sessions
                    </button>
                    <button
                        className={`text-left px-4 py-2 rounded font-medium transition-colors ${section === 'activity' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
                        onClick={() => setSection('activity')}
                    >
                        Activity
                    </button>
                </nav>
            </aside>
            {/* Main Content */}
            <main className="flex-1 p-6 space-y-8">
                <div className="mb-4">
                    <h2 className="text-3xl font-bold tracking-tight">Profile Settings</h2>
                    <p className="text-muted-foreground">
                        Manage your account information and security settings
                    </p>
                </div>

                {/* Activity Timeline Tab */}
                {section === 'activity' && (
                    <Card className="mb-8">
                        <CardHeader>
                            <CardTitle>Activity Timeline</CardTitle>
                            <CardDescription>
                                A visual timeline of your account activity
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="relative border-l-2 border-primary/30 pl-6 space-y-8">
                                {/* Timeline event: Account Created */}
                                <div className="flex items-start gap-4">
                                    <div className="absolute -left-3.5 mt-1.5 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white shadow-lg">
                                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" stroke="white" strokeWidth="2" fill="currentColor" /></svg>
                                    </div>
                                    <div>
                                        <div className="font-semibold">Account Created</div>
                                        <div className="text-xs text-muted-foreground">{user?.created_at ? new Date(user.created_at).toLocaleString() : 'Unknown'}</div>
                                    </div>
                                </div>
                                {/* Timeline event: Profile Last Updated */}
                                <div className="flex items-start gap-4">
                                    <div className="absolute -left-3.5 mt-1.5 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-lg">
                                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M12 8v4l3 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                    </div>
                                    <div>
                                        <div className="font-semibold">Profile Last Updated</div>
                                        <div className="text-xs text-muted-foreground">{user?.updated_at ? new Date(user.updated_at).toLocaleString() : 'Unknown'}</div>
                                    </div>
                                </div>
                                {/* Timeline event: Last Login */}
                                <div className="flex items-start gap-4">
                                    <div className="absolute -left-3.5 mt-1.5 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white shadow-lg">
                                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                    </div>
                                    <div>
                                        <div className="font-semibold">Last Login</div>
                                        <div className="text-xs text-muted-foreground">{user?.last_logged_in ? new Date(user.last_logged_in).toLocaleString() : 'Never'}</div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
                {/* Removed duplicate Profile Settings header */}
                {message && (
                    <div className={`p-4 rounded-md border ${message.type === 'success'
                        ? 'bg-green-50 text-green-800 border-green-200'
                        : 'bg-red-50 text-red-800 border-red-200'
                        }`}>
                        {message.text}
                    </div>
                )}
                {/* Section Content */}
                {section === 'profile' && (
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <User className="h-5 w-5" />
                                        Profile Information
                                    </CardTitle>
                                    <CardDescription>
                                        Update your personal information and avatar
                                    </CardDescription>
                                </div>
                                {!isEditing && (
                                    <Button onClick={() => setIsEditing(true)} variant="outline">
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit Profile
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Avatar Section */}
                            <div className="flex items-center space-x-6">
                                <AvatarManager user={user} onAvatarUpdate={handleAvatarUpdate} />
                                <div className="space-y-1">
                                    <h3 className="text-lg font-semibold">
                                        {user?.firstname && user?.lastname
                                            ? `${user.firstname} ${user.lastname}`
                                            : user?.username
                                        }
                                    </h3>
                                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                                    <div className="flex items-center space-x-2">
                                        <Badge variant={user?.is_active ? "default" : "secondary"}>
                                            {user?.is_active ? "Active" : "Inactive"}
                                        </Badge>
                                        {user?.roles?.map((role) => (
                                            <Badge key={role.id} variant="outline">
                                                {role.name}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            {!isEditing ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <Label className="text-sm font-medium">Username</Label>
                                        <p className="text-sm text-muted-foreground">{user?.username}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-sm font-medium">Email</Label>
                                        <p className="text-sm text-muted-foreground">{user?.email}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-sm font-medium">First Name</Label>
                                        <p className="text-sm text-muted-foreground">{user?.firstname || "Not set"}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-sm font-medium">Last Name</Label>
                                        <p className="text-sm text-muted-foreground">{user?.lastname || "Not set"}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-sm font-medium">Member Since</Label>
                                        <p className="text-sm text-muted-foreground">
                                            {user?.created_at
                                                ? new Date(user.created_at).toLocaleDateString()
                                                : "Unknown"
                                            }
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-sm font-medium">Last Login</Label>
                                        <p className="text-sm text-muted-foreground">
                                            {user?.last_logged_in
                                                ? new Date(user.last_logged_in).toLocaleDateString()
                                                : "Never"
                                            }
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleProfileSubmit} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="firstname">First Name</Label>
                                            <Input
                                                id="firstname"
                                                name="firstname"
                                                value={profileForm.firstname}
                                                onChange={handleProfileChange}
                                                placeholder="Enter your first name"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="lastname">Last Name</Label>
                                            <Input
                                                id="lastname"
                                                name="lastname"
                                                value={profileForm.lastname}
                                                onChange={handleProfileChange}
                                                placeholder="Enter your last name"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            value={profileForm.email}
                                            onChange={handleProfileChange}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="username">Username</Label>
                                        <Input
                                            id="username"
                                            name="username"
                                            value={profileForm.username}
                                            onChange={handleProfileChange}
                                            required
                                        />
                                    </div>
                                    {error && (
                                        <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md border border-destructive/20">
                                            {error}
                                        </div>
                                    )}
                                    <div className="flex gap-3">
                                        <Button type="submit" disabled={isLoading}>
                                            {isLoading ? (
                                                <>
                                                    <Save className="mr-2 h-4 w-4 animate-spin" />
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="mr-2 h-4 w-4" />
                                                    Save Changes
                                                </>
                                            )}
                                        </Button>
                                        <Button type="button" variant="outline" onClick={cancelEdit}>
                                            <X className="mr-2 h-4 w-4" />
                                            Cancel
                                        </Button>
                                    </div>
                                </form>
                            )}
                        </CardContent>
                    </Card>
                )}
                {section === 'security' && (
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Lock className="h-5 w-5" />
                                        Security Settings
                                    </CardTitle>
                                    <CardDescription>
                                        Manage your password and security preferences
                                    </CardDescription>
                                </div>
                                {!isChangingPassword && (
                                    <Button onClick={() => setIsChangingPassword(true)} variant="outline">
                                        <Lock className="mr-2 h-4 w-4" />
                                        Change Password
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {!isChangingPassword ? (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 border rounded-lg">
                                        <div>
                                            <h4 className="font-medium">Password</h4>
                                            <p className="text-sm text-muted-foreground">
                                                Last changed: Unknown
                                            </p>
                                        </div>
                                        <Button
                                            variant="outline"
                                            onClick={() => setIsChangingPassword(true)}
                                        >
                                            Change
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="currentPassword">Current Password</Label>
                                        <div className="relative">
                                            <Input
                                                id="currentPassword"
                                                name="currentPassword"
                                                type={showPasswords.current ? "text" : "password"}
                                                value={passwordForm.currentPassword}
                                                onChange={handlePasswordChange}
                                                required
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                onClick={() => togglePasswordVisibility('current')}
                                            >
                                                {showPasswords.current ? (
                                                    <EyeOff className="h-4 w-4" />
                                                ) : (
                                                    <Eye className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="newPassword">New Password</Label>
                                        <div className="relative">
                                            <Input
                                                id="newPassword"
                                                name="newPassword"
                                                type={showPasswords.new ? "text" : "password"}
                                                value={passwordForm.newPassword}
                                                onChange={handlePasswordChange}
                                                required
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                onClick={() => togglePasswordVisibility('new')}
                                            >
                                                {showPasswords.new ? (
                                                    <EyeOff className="h-4 w-4" />
                                                ) : (
                                                    <Eye className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                        <div className="relative">
                                            <Input
                                                id="confirmPassword"
                                                name="confirmPassword"
                                                type={showPasswords.confirm ? "text" : "password"}
                                                value={passwordForm.confirmPassword}
                                                onChange={handlePasswordChange}
                                                required
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                onClick={() => togglePasswordVisibility('confirm')}
                                            >
                                                {showPasswords.confirm ? (
                                                    <EyeOff className="h-4 w-4" />
                                                ) : (
                                                    <Eye className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                    {error && (
                                        <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md border border-destructive/20">
                                            {error}
                                        </div>
                                    )}
                                    <div className="flex gap-3">
                                        <Button type="submit" disabled={isLoading}>
                                            {isLoading ? (
                                                <>
                                                    <Lock className="mr-2 h-4 w-4 animate-spin" />
                                                    Changing...
                                                </>
                                            ) : (
                                                <>
                                                    <Lock className="mr-2 h-4 w-4" />
                                                    Change Password
                                                </>
                                            )}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={cancelPasswordChange}
                                        >
                                            <X className="mr-2 h-4 w-4" />
                                            Cancel
                                        </Button>
                                    </div>
                                </form>
                            )}
                        </CardContent>
                    </Card>
                )}
                {section === 'sessions' && (
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Active Sessions</CardTitle>
                                    <CardDescription>
                                        Manage your active login sessions across different devices
                                    </CardDescription>
                                </div>
                                {sessions.filter(s => !s.is_current).length > 0 && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => deleteAllOtherSessions()}
                                        className="text-red-600 hover:text-red-800"
                                    >
                                        Logout All Other Devices
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {sessionsLoading ? (
                                <div className="text-center py-4">Loading sessions...</div>
                            ) : sessionsError ? (
                                <div className="text-red-500 text-center py-4">{sessionsError}</div>
                            ) : sessions.length === 0 ? (
                                <div className="text-gray-500 text-center py-4">No active sessions</div>
                            ) : (
                                <div className="space-y-4">
                                    {sessions.map((session) => (
                                        <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                                            <div className="space-y-1">
                                                <div className="flex items-center space-x-2">
                                                    <span className="font-medium">Device:</span>
                                                    <span className="text-sm text-gray-600">
                                                        {session.user_agent || "Unknown Device"}
                                                    </span>
                                                    {session.is_current && (
                                                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                                            Current Session
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <span className="font-medium">IP Address:</span>
                                                    <span className="text-sm text-gray-600">
                                                        {session.ip_address || "Unknown"}
                                                    </span>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <span className="font-medium">Login Time:</span>
                                                    <span className="text-sm text-gray-600">
                                                        {new Date(session.created_at).toLocaleString()}
                                                    </span>
                                                </div>
                                                {session.expires_at && (
                                                    <div className="flex items-center space-x-2">
                                                        <span className="font-medium">Expires:</span>
                                                        <span className="text-sm text-gray-600">
                                                            {new Date(session.expires_at).toLocaleString()}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => deleteSession(session.id)}
                                                disabled={sessionsLoading}
                                                title={session.is_current ? "Logout from current session (you will be redirected to login)" : "Logout from this device"}
                                            >
                                                {session.is_current ? "Logout (Current)" : "Logout Device"}
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </main>
        </div>
    );
}
