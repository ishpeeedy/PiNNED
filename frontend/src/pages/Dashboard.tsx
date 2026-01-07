import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Navbar from '@/components/Navbar';

export default function Dashboard() {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen">
            <Navbar />
            <div className="p-8">
                <div className="max-w-4xl mx-auto">
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                Welcome to PINNED, {user?.name}!
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            <p>Email: {user?.email}</p>
                            <Button onClick={handleLogout} variant="neutral">
                                Logout
                            </Button>
                            <p className="text-gray-600 mt-8">
                                Your boards will appear here soon...
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
