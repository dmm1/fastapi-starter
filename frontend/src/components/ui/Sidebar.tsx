import { Link } from "@tanstack/react-router";
import { useAuthStore } from "../../stores/auth";

export function Sidebar() {
    const { user } = useAuthStore();
    return (
        <aside className="w-64 h-full bg-white shadow flex flex-col gap-2 p-4">
            <Link to="/" className="font-bold text-lg text-blue-600 mb-4">Dashboard</Link>
            {user && (
                <>
                    <Link to="/profile" className="text-gray-700 hover:text-blue-600 px-2 py-1 rounded hover:bg-gray-50">
                        Profile
                    </Link>
                    {user.roles?.some(role => role.name === "admin") && (
                        <Link to="/admin" className="text-gray-700 hover:text-blue-600 px-2 py-1 rounded hover:bg-gray-50">
                            Admin Panel
                        </Link>
                    )}
                </>
            )}
        </aside>
    );
}
