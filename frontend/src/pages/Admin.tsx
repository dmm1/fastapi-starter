import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Users,
    Shield,
    Edit,
    Trash2,
    Plus,
    Search,
    MoreHorizontal,
    UserCheck,
    UserX
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "../components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { useAuthGuard } from "../hooks/useAuthGuard";
import { usersApi, rolesApi, type User } from "../lib/api-client";

export default function AdminPage() {
    const { isAuthenticated, user } = useAuthGuard(["admin"]);
    const queryClient = useQueryClient();
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [userForm, setUserForm] = useState({
        email: "",
        username: "",
        firstname: "",
        lastname: "",
        is_active: true,
        is_admin: false,
    });

    // Queries
    const { data: users, isLoading: usersLoading } = useQuery({
        queryKey: ["admin-users"],
        queryFn: () => usersApi.getAllUsers(),
        enabled: isAuthenticated && user?.roles?.some(role => role.name === "admin"),
    });

    useQuery({
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
            setIsEditDialogOpen(false);
            setSelectedUser(null);
        },
    });

    const deleteUserMutation = useMutation({
        mutationFn: (userId: number) => usersApi.deleteUser(userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-users"] });
            setIsDeleteDialogOpen(false);
            setSelectedUser(null);
        },
    });

    if (!isAuthenticated) {
        return null; // Will redirect to login
    }

    // Filter users based on search term
    const filteredUsers = users?.filter(user =>
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.firstname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastname?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    function openEditDialog(user: User) {
        setSelectedUser(user);
        setUserForm({
            email: user.email || "",
            username: user.username || "",
            firstname: user.firstname || "",
            lastname: user.lastname || "",
            is_active: user.is_active || false,
            is_admin: user.roles?.some(role => role.name === "admin") || false,
        });
        setIsEditDialogOpen(true);
    }

    function openDeleteDialog(user: User) {
        setSelectedUser(user);
        setIsDeleteDialogOpen(true);
    }

    function handleUserFormChange(e: React.ChangeEvent<HTMLInputElement>) {
        const { name, type, checked, value } = e.target;
        setUserForm(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }));
    }

    async function handleUpdateUser(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedUser) return;

        await updateUserMutation.mutateAsync({
            userId: selectedUser.id,
            userData: userForm
        });
    }

    async function handleDeleteUser() {
        if (!selectedUser) return;
        await deleteUserMutation.mutateAsync(selectedUser.id);
    }

    if (usersLoading) {
        return (
            <div className="flex min-h-screen bg-background">
                <div className="flex items-center justify-center w-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    const statsCards = [
        {
            title: "Total Users",
            value: users?.length || 0,
            description: "Registered users",
            icon: Users,
        },
        {
            title: "Admin Users",
            value: users?.filter(u => u.roles?.some(r => r.name === "admin")).length || 0,
            description: "Users with admin role",
            icon: Shield,
        },
        {
            title: "Active Users",
            value: users?.filter(u => u.is_active).length || 0,
            description: "Currently active users",
            icon: UserCheck,
        },
        {
            title: "Inactive Users",
            value: users?.filter(u => !u.is_active).length || 0,
            description: "Deactivated users",
            icon: UserX,
        }
    ];

    return (
        <div className="flex-1 space-y-8 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
                    <p className="text-muted-foreground">
                        Manage users and system administration
                    </p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {statsCards.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <Card key={index}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {stat.title}
                                </CardTitle>
                                <Icon className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stat.value}</div>
                                <p className="text-xs text-muted-foreground">
                                    {stat.description}
                                </p>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Users Management */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>User Management</CardTitle>
                            <CardDescription>
                                View and manage all registered users
                            </CardDescription>
                        </div>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add User
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Search */}
                    <div className="flex items-center space-x-2 mb-4">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="max-w-sm"
                        />
                    </div>

                    {/* Users Table */}
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Roles</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredUsers.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <div className="flex items-center space-x-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage
                                                        src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.firstname || user.username}`}
                                                        alt={user.username}
                                                    />
                                                    <AvatarFallback>
                                                        {(user.firstname?.[0] || user.username?.[0] || 'U').toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="font-medium">
                                                        {user.firstname && user.lastname
                                                            ? `${user.firstname} ${user.lastname}`
                                                            : user.username
                                                        }
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {user.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={user.is_active ? "default" : "secondary"}>
                                                {user.is_active ? "Active" : "Inactive"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {user.roles?.map((role) => (
                                                    <Badge key={role.id} variant="outline">
                                                        {role.name}
                                                    </Badge>
                                                )) || (
                                                        <span className="text-sm text-muted-foreground">No roles</span>
                                                    )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {user.created_at
                                                ? new Date(user.created_at).toLocaleDateString()
                                                : "Unknown"
                                            }
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem
                                                        onClick={() => openEditDialog(user)}
                                                    >
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() => openDeleteDialog(user)}
                                                        className="text-destructive"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Edit User Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>
                        <DialogDescription>
                            Make changes to the user account here. Click save when you're done.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdateUser} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstname">First Name</Label>
                                <Input
                                    id="firstname"
                                    name="firstname"
                                    value={userForm.firstname}
                                    onChange={handleUserFormChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastname">Last Name</Label>
                                <Input
                                    id="lastname"
                                    name="lastname"
                                    value={userForm.lastname}
                                    onChange={handleUserFormChange}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                value={userForm.email}
                                onChange={handleUserFormChange}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input
                                id="username"
                                name="username"
                                value={userForm.username}
                                onChange={handleUserFormChange}
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="is_active"
                                name="is_active"
                                checked={userForm.is_active}
                                onChange={handleUserFormChange}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <Label htmlFor="is_active">Active</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="is_admin"
                                name="is_admin"
                                checked={userForm.is_admin}
                                onChange={handleUserFormChange}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <Label htmlFor="is_admin">Admin</Label>
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsEditDialogOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={updateUserMutation.isPending}>
                                {updateUserMutation.isPending ? "Saving..." : "Save Changes"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete User Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete User</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this user? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsDeleteDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteUser}
                            disabled={deleteUserMutation.isPending}
                        >
                            {deleteUserMutation.isPending ? "Deleting..." : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
