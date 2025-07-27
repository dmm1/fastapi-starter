import { useEffect } from "react";
import type { ReactNode } from "react";
import { Outlet, useRouter } from "@tanstack/react-router";
import { tokenUtils } from "../lib/api-client";
import { useAuthStore } from "../stores/auth";

interface AuthedLayoutProps {
    children?: ReactNode;
}

export function AuthedLayout({ children }: AuthedLayoutProps) {
    const router = useRouter();
    const { isLoading } = useAuthStore();

    useEffect(() => {
        if (!tokenUtils.isAuthenticated()) {
            router.navigate({ to: "/login" });
        }
    }, [router]);

    // Show loading while checking authentication
    if (!tokenUtils.isAuthenticated()) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900">Loading...</h1>
                    <p className="mt-2 text-gray-600">Checking authentication...</p>
                </div>
            </div>
        );
    }

    // Show loading while fetching user data
    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900">Loading...</h1>
                    <p className="mt-2 text-gray-600">Loading user data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm border-b">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-xl font-semibold text-gray-900">
                            FastAPI Starter
                        </h1>
                        <nav className="space-x-4">
                            <a href="/dashboard" className="text-gray-600 hover:text-gray-900">
                                Dashboard
                            </a>
                            <a href="/profile" className="text-gray-600 hover:text-gray-900">
                                Profile
                            </a>
                            <a href="/admin" className="text-gray-600 hover:text-gray-900">
                                Admin
                            </a>
                            <button
                                onClick={() => {
                                    tokenUtils.clearTokens();
                                    router.navigate({ to: "/login" });
                                }}
                                className="text-red-600 hover:text-red-700"
                            >
                                Logout
                            </button>
                        </nav>
                    </div>
                </div>
            </header>
            <main className="container mx-auto px-4 py-8">
                {children || <Outlet />}
            </main>
        </div>
    );
}
