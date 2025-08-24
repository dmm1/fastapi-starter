import { BarChart3, Users, Activity, CreditCard } from "lucide-react"
import { useAuthGuard } from "../hooks/useAuthGuard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar"

export default function Dashboard() {
    const { isAuthenticated, user, isLoading } = useAuthGuard();

    if (!isAuthenticated) {
        return null; // Will redirect to login
    }

    if (isLoading) {
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
            title: "Total Revenue",
            value: "$45,231.89",
            description: "+20.1% from last month",
            icon: CreditCard,
            trend: "up"
        },
        {
            title: "Subscribers",
            value: "+2,350",
            description: "+180.1% from last month",
            icon: Users,
            trend: "up"
        },
        {
            title: "Sales",
            value: "+12,234",
            description: "+19% from last month",
            icon: BarChart3,
            trend: "up"
        },
        {
            title: "Active Now",
            value: "+573",
            description: "+201 since last hour",
            icon: Activity,
            trend: "up"
        }
    ]

    return (
        <div className="flex-1 space-y-8 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                    <p className="text-muted-foreground">
                        Welcome back, {user?.firstname || user?.username}! Here's what's happening today.
                    </p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {statsCards.map((stat, index) => {
                    const Icon = stat.icon
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
                    )
                })}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* User Profile Card */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Account Overview</CardTitle>
                        <CardDescription>
                            Your account information and activity
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center space-x-4">
                            <Avatar className="h-16 w-16">
                                <AvatarImage
                                    src={user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.firstname || user?.username}`}
                                    alt={user?.username}
                                />
                                <AvatarFallback>
                                    {(user?.firstname?.[0] || user?.username?.[0] || 'U').toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
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
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <p className="text-sm font-medium">Username</p>
                                <p className="text-sm text-muted-foreground">{user?.username}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium">Email</p>
                                <p className="text-sm text-muted-foreground">{user?.email}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium">Member Since</p>
                                <p className="text-sm text-muted-foreground">
                                    {user?.created_at
                                        ? new Date(user.created_at).toLocaleDateString()
                                        : "Unknown"
                                    }
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium">Last Login</p>
                                <p className="text-sm text-muted-foreground">
                                    {user?.last_logged_in
                                        ? new Date(user.last_logged_in).toLocaleDateString()
                                        : "Never"
                                    }
                                </p>
                            </div>
                        </div>

                        {user?.roles && user.roles.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-sm font-medium">Roles</p>
                                <div className="flex flex-wrap gap-2">
                                    {user.roles.map((role) => (
                                        <Badge key={role.id} variant="outline">
                                            {role.name}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>
                            Your latest account activity
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center space-x-4">
                                <div className="w-2 h-2 bg-primary rounded-full"></div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium">Last Login</p>
                                    <p className="text-xs text-muted-foreground">
                                        {user?.last_logged_in
                                            ? new Date(user.last_logged_in).toLocaleString()
                                            : "Never"
                                        }
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <div className="w-2 h-2 bg-muted rounded-full"></div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium">Profile last updated</p>
                                    <p className="text-xs text-muted-foreground">
                                        {user?.updated_at
                                            ? new Date(user.updated_at).toLocaleString()
                                            : "Unknown"
                                        }
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <div className="w-2 h-2 bg-muted rounded-full"></div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium">Account created</p>
                                    <p className="text-xs text-muted-foreground">
                                        {user?.created_at
                                            ? new Date(user.created_at).toLocaleString()
                                            : "Unknown"
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
