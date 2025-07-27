import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "../components/ui/Layout";
import { Button } from "../components/ui/button";
import { Card, CardHeader, CardContent } from "../components/ui/card";
import { useAuthGuard } from "../hooks/useAuthGuard";
import { usersApi, rolesApi, type User } from "../lib/api-client";

export default function AdminPage() {
    const { isAuthenticated, user } = useAuthGuard(["admin"]);
    const queryClient = useQueryClient();
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isEditingUser, setIsEditingUser] = useState(false);
    const [userForm, setUserForm] = useState({
        email: "",
        username: "",
        firstname: "",
        lastname: "",
        is_active: true,
        is_admin: false,
    });

    // Queries
    const { data: users, isLoading: usersLoading, error: usersError } = useQuery({
        queryKey: ["admin-users"],
        queryFn: () => usersApi.getAllUsers(),
        enabled: isAuthenticated && user?.roles?.some(role => role.name === "admin"),
    });

    const { data: roles, isLoading: rolesLoading } = useQuery({
        queryKey: ["roles"],
        queryFn: () => rolesApi.getAllRoles(),
        enabled: isAuthenticated && user?.roles?.some(role => role.name === "admin"),
    });

    // Mutations
    const updateUserMutation = useMutation({
        mutationFn: ({ userId, userData }: { userId: number, userData: any }) =>
            usersApi.updateUser(userId, userData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-users"] });
            setIsEditingUser(false);
            setSelectedUser(null);
        },
    });

    const deleteUserMutation = useMutation({
        mutationFn: (userId: number) => usersApi.deleteUser(userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-users"] });
            setSelectedUser(null);
        },
    });

    const assignRolesMutation = useMutation({
        mutationFn: ({ userId, roles }: { userId: number, roles: string[] }) =>
            rolesApi.assignUserRoles({ user_id: userId, roles }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-users"] });
        },
    });

    if (!isAuthenticated) {
        return null; // Will redirect to login
    }

    if (!user?.roles?.some(role => role.name === "admin")) {
        return (
            <Layout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
                        <p className="text-gray-600">You don't have permission to access this page.</p>
                    </div>
                </div>
            </Layout>
        );
    }

    function handleEditUser(user: User) {
        setSelectedUser(user);
        setUserForm({
            email: user.email,
            username: user.username,
            firstname: user.firstname || "",
            lastname: user.lastname || "",
            is_active: user.is_active,
            is_admin: user.is_admin,
        });
        setIsEditingUser(true);
    }

    function handleUserFormChange(e: React.ChangeEvent<HTMLInputElement>) {
        const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
        setUserForm({ ...userForm, [e.target.name]: value });
    }

    function handleUpdateUser(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedUser) return;

        updateUserMutation.mutate({
            userId: selectedUser.id,
            userData: userForm,
        });
    }

    function handleDeleteUser(userId: number) {
        if (window.confirm("Are you sure you want to delete this user?")) {
            deleteUserMutation.mutate(userId);
        }
    }

    function handleToggleRole(userId: number, roleName: string, isAssigned: boolean) {
        const targetUser = users?.find(u => u.id === userId);
        if (!targetUser) return;

        const currentRoles = targetUser.roles.map(r => r.name);
        const newRoles = isAssigned
            ? currentRoles.filter(r => r !== roleName)
            : [...currentRoles, roleName];

        assignRolesMutation.mutate({ userId, roles: newRoles });
    }

    if (usersLoading || rolesLoading) {
        return (
            <Layout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </Layout>
        );
    }

    if (usersError) {
        return (
            <Layout>
                <div className="text-red-600 text-center p-8">
                    Error loading admin data: {String(usersError)}
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                    <p className="mt-2 text-gray-600">
                        Manage users, roles, and system settings.
                    </p>
                </div>

                {/* User Management Card */}
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-semibold">User Management</h2>
                            <div className="text-sm text-gray-600">
                                Total Users: {users?.length || 0}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            User
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Roles
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {users?.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {user.firstname} {user.lastname}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {user.email}
                                                        </div>
                                                        <div className="text-xs text-gray-400">
                                                            @{user.username}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col gap-1">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.is_active
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {user.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                    {user.is_admin && (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                            Admin
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {user.roles?.map((role) => (
                                                        <span
                                                            key={role.id}
                                                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                                        >
                                                            {role.name}
                                                        </span>
                                                    ))}
                                                </div>
                                                {/* Role toggle buttons */}
                                                <div className="mt-2 flex flex-wrap gap-1">
                                                    {roles?.map((role) => {
                                                        const isAssigned = user.roles?.some(r => r.name === role.name);
                                                        return (
                                                            <button
                                                                key={role.id}
                                                                onClick={() => handleToggleRole(user.id, role.name, isAssigned)}
                                                                className={`text-xs px-2 py-1 rounded ${isAssigned
                                                                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                                    }`}
                                                                disabled={assignRolesMutation.isPending}
                                                            >
                                                                {isAssigned ? `Remove ${role.name}` : `Add ${role.name}`}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex gap-2">
                                                    <Button
                                                        onClick={() => handleEditUser(user)}
                                                        className="bg-green-600 hover:bg-green-700 text-xs px-3 py-1"
                                                    >
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        onClick={() => handleDeleteUser(user.id)}
                                                        className="bg-red-600 hover:bg-red-700 text-xs px-3 py-1"
                                                        disabled={user.id === user.id} // Can't delete self
                                                    >
                                                        Delete
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Edit User Modal */}
                {isEditingUser && selectedUser && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-md">
                            <h3 className="text-lg font-semibold mb-4">Edit User</h3>
                            <form onSubmit={handleUpdateUser} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={userForm.email}
                                        onChange={handleUserFormChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Username
                                    </label>
                                    <input
                                        type="text"
                                        name="username"
                                        value={userForm.username}
                                        onChange={handleUserFormChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            First Name
                                        </label>
                                        <input
                                            type="text"
                                            name="firstname"
                                            value={userForm.firstname}
                                            onChange={handleUserFormChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Last Name
                                        </label>
                                        <input
                                            type="text"
                                            name="lastname"
                                            value={userForm.lastname}
                                            onChange={handleUserFormChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            name="is_active"
                                            checked={userForm.is_active}
                                            onChange={handleUserFormChange}
                                            className="mr-2"
                                        />
                                        <span className="text-sm font-medium text-gray-700">Active</span>
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            name="is_admin"
                                            checked={userForm.is_admin}
                                            onChange={handleUserFormChange}
                                            className="mr-2"
                                        />
                                        <span className="text-sm font-medium text-gray-700">Admin</span>
                                    </label>
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <Button
                                        type="submit"
                                        disabled={updateUserMutation.isPending}
                                    >
                                        {updateUserMutation.isPending ? "Saving..." : "Save Changes"}
                                    </Button>
                                    <Button
                                        type="button"
                                        className="bg-gray-600 hover:bg-gray-700"
                                        onClick={() => {
                                            setIsEditingUser(false);
                                            setSelectedUser(null);
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}
