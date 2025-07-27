import { Link } from "@tanstack/react-router";
import { Button } from "../components/ui/button";

export default function NotFoundPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
            <div className="text-center">
                <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">Page Not Found</h2>
                <p className="text-gray-600 mb-8">
                    Sorry, the page you are looking for doesn't exist or you don't have permission to access it.
                </p>
                <div className="space-x-4">
                    <Link to="/">
                        <Button>Go to Dashboard</Button>
                    </Link>
                    <Link to="/login">
                        <Button className="bg-gray-600 hover:bg-gray-700">Login</Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
