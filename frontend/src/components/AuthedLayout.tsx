import { useEffect } from "react";
import type { ReactNode } from "react";
import { Outlet, useRouter, Link } from "@tanstack/react-router";
import { tokenUtils } from "../lib/api-client";
import { useAuthStore } from "../stores/auth";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "./ui/dropdown-menu";
import { ThemeToggle } from "./ui/theme-toggle";
import {
    Home,
    User,
    Settings,
    LogOut,
    Menu,
    ShieldCheck
} from "lucide-react";

interface AuthedLayoutProps {
    children?: ReactNode;
}

export function AuthedLayout({ children }: AuthedLayoutProps) {
    const router = useRouter();
    const { user, isLoading } = useAuthStore();

    useEffect(() => {
        if (!tokenUtils.isAuthenticated()) {
            router.navigate({ to: "/login" });
        }
    }, [router]);

    // Show loading while checking authentication
    if (!tokenUtils.isAuthenticated()) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <h1 className="text-2xl font-bold">Loading...</h1>
                    <p className="mt-2 text-muted-foreground">Checking authentication...</p>
                </div>
            </div>
        );
    }

    // Show loading while fetching user data
    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <h1 className="text-2xl font-bold">Loading...</h1>
                    <p className="mt-2 text-muted-foreground">Loading user data...</p>
                </div>
            </div>
        );
    }

    const handleLogout = () => {
        tokenUtils.clearTokens();
        router.navigate({ to: "/login" });
    };

    const navigation = [
        { name: "Dashboard", href: "/dashboard", icon: Home },
        { name: "Profile", href: "/profile", icon: User },
        { name: "Admin", href: "/admin", icon: ShieldCheck },
    ];

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-14 items-center">
                    <div className="mr-4 hidden md:flex">
                        <Link to="/dashboard" className="mr-6 flex items-center space-x-2">
                            <span className="hidden font-bold sm:inline-block">
                                FastAPI Starter
                            </span>
                        </Link>
                        <nav className="flex items-center space-x-6 text-sm font-medium">
                            {navigation.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.name}
                                        to={item.href}
                                        className="flex items-center space-x-2 transition-colors hover:text-foreground/80 text-foreground/60"
                                    >
                                        <Icon className="h-4 w-4" />
                                        <span>{item.name}</span>
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Mobile menu button */}
                    <Button
                        variant="ghost"
                        className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
                    >
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Toggle Menu</span>
                    </Button>

                    <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
                        <div className="w-full flex-1 md:w-auto md:flex-none">
                            {/* Search can be added here */}
                        </div>
                        <nav className="flex items-center space-x-2">
                            <ThemeToggle />

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage
                                                src={user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.firstname || user?.username}`}
                                                alt={user?.username}
                                            />
                                            <AvatarFallback>
                                                {(user?.firstname?.[0] || user?.username?.[0] || 'U').toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56" align="end" forceMount>
                                    <DropdownMenuLabel className="font-normal">
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-medium leading-none">
                                                {user?.firstname && user?.lastname
                                                    ? `${user.firstname} ${user.lastname}`
                                                    : user?.username
                                                }
                                            </p>
                                            <p className="text-xs leading-none text-muted-foreground">
                                                {user?.email}
                                            </p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <Link to="/profile" className="flex items-center">
                                            <User className="mr-2 h-4 w-4" />
                                            <span>Profile</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                        <Settings className="mr-2 h-4 w-4" />
                                        <span>Settings</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={handleLogout}>
                                        <LogOut className="mr-2 h-4 w-4" />
                                        <span>Log out</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </nav>
                    </div>
                </div>
            </header>

            {/* Main content */}
            <main className="flex-1">
                {children || <Outlet />}
            </main>
        </div>
    );
}
