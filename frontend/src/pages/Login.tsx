import { useState, useEffect } from "react";
import { useRouter } from "@tanstack/react-router";
import { Button } from "../components/ui/button";
import { Card, CardHeader, CardContent } from "../components/ui/card";
import { useAuthStore } from "../stores/auth";
import { tokenUtils } from "../lib/api-client";

export default function LoginPage() {
    const [form, setForm] = useState({ email: "admin@example.com", password: "" });
    const [showPassword, setShowPassword] = useState(false);
    const { login, register, isLoading, error, clearError, user } = useAuthStore();
    const [isRegisterMode, setIsRegisterMode] = useState(false);
    const [registerForm, setRegisterForm] = useState({
        email: "",
        username: "",
        password: "",
        confirmPassword: "",
        firstname: "",
        lastname: "",
    });
    const router = useRouter();

    // Redirect if already authenticated
    useEffect(() => {
        if (tokenUtils.isAuthenticated() && user) {
            router.navigate({ to: "/" });
        }
    }, [user, router]);

    // Clear error when switching modes
    useEffect(() => {
        clearError();
    }, [isRegisterMode, clearError]);

    function handleLoginChange(e: React.ChangeEvent<HTMLInputElement>) {
        setForm({ ...form, [e.target.name]: e.target.value });
    }

    function handleRegisterChange(e: React.ChangeEvent<HTMLInputElement>) {
        setRegisterForm({ ...registerForm, [e.target.name]: e.target.value });
    }

    async function handleLoginSubmit(e: React.FormEvent) {
        e.preventDefault();
        const result = await login(form.email, form.password);
        if (result.success) {
            router.navigate({ to: "/" });
        }
    }

    async function handleRegisterSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (registerForm.password !== registerForm.confirmPassword) {
            // Show error for password mismatch
            return;
        }

        const result = await register({
            email: registerForm.email,
            username: registerForm.username,
            password: registerForm.password,
            firstname: registerForm.firstname || undefined,
            lastname: registerForm.lastname || undefined,
        });

        if (result.success) {
            setIsRegisterMode(false);
            setForm({ email: registerForm.email, password: "" });
            // Show success message
        }
    }

    if (tokenUtils.isAuthenticated() && user) {
        return null; // Will redirect
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <h2 className="text-2xl font-bold text-center text-gray-900">
                        {isRegisterMode ? "Create Account" : "Sign In"}
                    </h2>
                    <p className="text-center text-gray-600">
                        {isRegisterMode
                            ? "Enter your details to create a new account"
                            : "Enter your credentials to access your account"
                        }
                    </p>
                </CardHeader>
                <CardContent>
                    {!isRegisterMode ? (
                        <form onSubmit={handleLoginSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={form.email}
                                    onChange={handleLoginChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        id="password"
                                        name="password"
                                        value={form.password}
                                        onChange={handleLoginChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? "Hide" : "Show"}
                                    </button>
                                </div>
                            </div>
                            {error && (
                                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                                    {error}
                                </div>
                            )}
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isLoading}
                            >
                                {isLoading ? "Signing In..." : "Sign In"}
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={handleRegisterSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="firstname" className="block text-sm font-medium text-gray-700 mb-1">
                                        First Name
                                    </label>
                                    <input
                                        type="text"
                                        id="firstname"
                                        name="firstname"
                                        value={registerForm.firstname}
                                        onChange={handleRegisterChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                                        value={registerForm.lastname}
                                        onChange={handleRegisterChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700 mb-1">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    id="reg-email"
                                    name="email"
                                    value={registerForm.email}
                                    onChange={handleRegisterChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="reg-username" className="block text-sm font-medium text-gray-700 mb-1">
                                    Username
                                </label>
                                <input
                                    type="text"
                                    id="reg-username"
                                    name="username"
                                    value={registerForm.username}
                                    onChange={handleRegisterChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700 mb-1">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    id="reg-password"
                                    name="password"
                                    value={registerForm.password}
                                    onChange={handleRegisterChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                                    Confirm Password
                                </label>
                                <input
                                    type="password"
                                    id="confirm-password"
                                    name="confirmPassword"
                                    value={registerForm.confirmPassword}
                                    onChange={handleRegisterChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                            </div>
                            {error && (
                                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                                    {error}
                                </div>
                            )}
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isLoading}
                            >
                                {isLoading ? "Creating Account..." : "Create Account"}
                            </Button>
                        </form>
                    )}

                    <div className="mt-6 text-center">
                        <button
                            type="button"
                            onClick={() => setIsRegisterMode(!isRegisterMode)}
                            className="text-blue-600 hover:text-blue-500 font-medium"
                        >
                            {isRegisterMode
                                ? "Already have an account? Sign in"
                                : "Don't have an account? Create one"
                            }
                        </button>
                    </div>

                    {!isRegisterMode && (
                        <div className="mt-4 p-4 bg-blue-50 rounded-md">
                            <p className="text-sm text-blue-800 font-medium">Demo Credentials:</p>
                            <p className="text-sm text-blue-700">Email: admin@example.com</p>
                            <p className="text-sm text-blue-700">Password: admin123</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
