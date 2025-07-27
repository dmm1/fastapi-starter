import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import type { ReactNode } from "react";

export function Layout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Navbar />
            <div className="flex flex-1">
                <Sidebar />
                <main className="flex-1 p-6">{children}</main>
            </div>
        </div>
    );
}
