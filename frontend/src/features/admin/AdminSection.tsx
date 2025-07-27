import { Card, CardHeader, CardContent } from "../../components/ui/card";

export function AdminSection() {
    return (
        <Card>
            <CardHeader>Admin Section</CardHeader>
            <CardContent>
                {/* Render admin-specific dashboard widgets here */}
                <div>User management, system metrics, etc.</div>
            </CardContent>
        </Card>
    );
}
