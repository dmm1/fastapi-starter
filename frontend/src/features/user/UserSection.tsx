import { Card, CardHeader, CardContent } from "../../components/ui/card";

export function UserSection() {
    return (
        <Card>
            <CardHeader>User Section</CardHeader>
            <CardContent>
                {/* Render user-specific dashboard widgets here */}
                <div>Profile, recent activity, etc.</div>
            </CardContent>
        </Card>
    );
}
