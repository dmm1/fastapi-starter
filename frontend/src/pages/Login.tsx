import { useState, useEffect } from "react";
import { useRouter } from "@tanstack/react-router";
import { Button } from "../components/ui/button";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useAuthStore } from "../stores/auth";
import { tokenUtils } from "../lib/api-client";
import { ThemeToggle } from "../components/ui/theme-toggle";
import { Eye, EyeOff, Loader2 } from "lucide-react";

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
            // Handle password mismatch
            return;
        }

        const result = await register({
            email: registerForm.email,
            username: registerForm.username,
            password: registerForm.password,
            firstname: registerForm.firstname,
            lastname: registerForm.lastname,
        });

        if (result.success) {
            router.navigate({ to: "/" });
        }
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            {/* Theme toggle in top right */}
            <div className="absolute top-4 right-4">
                <ThemeToggle />
            </div>

            <div className="w-full max-w-md space-y-6">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold">FastAPI Starter</h1>
                    <p className="text-muted-foreground">
                        {isRegisterMode ? "Create your account" : "Sign in to your account"}
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>{isRegisterMode ? "Create Account" : "Welcome Back"}</CardTitle>
                        <CardDescription>
                            {isRegisterMode
                                ? "Enter your information to create your account"
                                : "Enter your credentials to access your account"
                            }
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {error && (
                            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md border border-destructive/20">
                                {error}
                            </div>
                        )}

                        {!isRegisterMode ? (
                            <form onSubmit={handleLoginSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        value={form.email}
                                        onChange={handleLoginChange}
                                        placeholder="admin@example.com"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            name="password"
                                            type={showPassword ? "text" : "password"}
                                            value={form.password}
                                            onChange={handleLoginChange}
                                            placeholder="Enter your password"
                                            required
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                </div>

                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Signing in...
                                        </>
                                    ) : (
                                        "Sign In"
                                    )}
                                </Button>
                            </form>
                        ) : (
                            <form onSubmit={handleRegisterSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="firstname">First Name</Label>
                                        <Input
                                            id="firstname"
                                            name="firstname"
                                            value={registerForm.firstname}
                                            onChange={handleRegisterChange}
                                            placeholder="John"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lastname">Last Name</Label>
                                        <Input
                                            id="lastname"
                                            name="lastname"
                                            value={registerForm.lastname}
                                            onChange={handleRegisterChange}
                                            placeholder="Doe"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="reg-email">Email</Label>
                                    <Input
                                        id="reg-email"
                                        name="email"
                                        type="email"
                                        value={registerForm.email}
                                        onChange={handleRegisterChange}
                                        placeholder="john@example.com"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="username">Username</Label>
                                    <Input
                                        id="username"
                                        name="username"
                                        value={registerForm.username}
                                        onChange={handleRegisterChange}
                                        placeholder="johndoe"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="reg-password">Password</Label>
                                    <Input
                                        id="reg-password"
                                        name="password"
                                        type="password"
                                        value={registerForm.password}
                                        onChange={handleRegisterChange}
                                        placeholder="Create a secure password"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                                    <Input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type="password"
                                        value={registerForm.confirmPassword}
                                        onChange={handleRegisterChange}
                                        placeholder="Confirm your password"
                                        required
                                    />
                                </div>

                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Creating account...
                                        </>
                                    ) : (
                                        "Create Account"
                                    )}
                                </Button>
                            </form>
                        )}

                        <div className="text-center">
                            <Button
                                variant="link"
                                onClick={() => setIsRegisterMode(!isRegisterMode)}
                                className="text-sm"
                            >
                                {isRegisterMode
                                    ? "Already have an account? Sign in"
                                    : "Don't have an account? Sign up"
                                }
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <div className="text-center text-xs text-muted-foreground">
                    <p>© 2025 FastAPI Starter. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
}
