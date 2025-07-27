import type { ReactNode } from "react";
import { clsx } from "clsx";

export function Card({ children, className }: { children: ReactNode; className?: string }) {
    return <div className={clsx("bg-white shadow rounded-lg", className)}>{children}</div>;
}
export function CardHeader({ children }: { children: ReactNode }) {
    return <div className="px-6 py-4 border-b font-semibold text-lg">{children}</div>;
}
export function CardContent({ children }: { children: ReactNode }) {
    return <div className="px-6 py-4">{children}</div>;
}
