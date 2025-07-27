import { Link } from "@tanstack/react-router";
import { useAuthStore } from "../../stores/auth";
import { Button } from "./button";

export function Navbar() {
    const { user, logout } = useAuthStore();

    const handleLogout = async () => {
        await logout();
    };

    return (
        <nav className="flex items-center justify-between px-6 py-4 bg-white shadow">
            <div className="flex items-center gap-4">
                <Link to="/" className="font-bold text-lg text-blue-600">Dashboard</Link>
                {user && (
                    <>
                        <Link to="/profile" className="text-gray-700 hover:text-blue-600">Profile</Link>
                        {user.roles?.some(role => role.name === "admin") && (
                            <Link to="/admin" className="text-gray-700 hover:text-blue-600">Admin</Link>
                        )}
                    </>
                )}
            </div>
            <div className="flex items-center gap-2">
                {user ? (
                    <>
                        <span className="text-gray-600">{user.username}</span>
                        <Button onClick={handleLogout}>Logout</Button>
                    </>
                ) : (
                    <Link to="/login" className="text-blue-600">Login</Link>
                )}
            </div>
        </nav>
    );
}
