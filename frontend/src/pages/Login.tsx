import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Pinwheel from '@/components/pinwheel/Pinwheel';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authAPI } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import Footer from '@/components/Footer';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const setAuth = useAuthStore((state) => state.setAuth);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const data = await authAPI.login(email, password);
            setAuth(data.user, data.token);
            toast.success('Welcome back!');
            navigate('/dashboard');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1 flex items-center justify-center grid-pattern">
                <Card className="mt-[-20px] mr-[14px] w-[400px] shadow-shadow">
                    <CardHeader>
                        <CardTitle>Login to PINNED</CardTitle>
                        <CardDescription>
                            Enter your email below to login to your account
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubmit}>
                        <CardContent>
                            <div className="flex flex-col gap-6">
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="m@example.com"
                                        value={email}
                                        onChange={(e) =>
                                            setEmail(e.target.value)
                                        }
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="password">Password</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) =>
                                            setPassword(e.target.value)
                                        }
                                        required
                                    />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex-col gap-2 mt-4">
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={loading}
                            >
                                {loading ? 'Logging in...' : 'Login'}
                            </Button>
                            <div className="mt-4 text-center text-sm">
                                Don't have an account?{' '}
                                <Link to="/register" className="underline">
                                    <span> Sign up</span>
                                    <svg
                                        viewBox="0 0 13 20"
                                        className="w-4 h-4"
                                    >
                                        <polyline points="0.5 19.5 3 19.5 12.5 10 3 0.5" />
                                    </svg>
                                </Link>
                            </div>
                        </CardFooter>
                    </form>
                </Card>
            </main>

            {/* Pinwheels — fixed at bottom, hidden on small screens */}
            <div
                className="fixed bottom-13 left-0 w-full h-0 pointer-events-none z-[1] hidden lg:block"
                aria-hidden="true"
            >
                <Pinwheel className="absolute bottom-0 left-[4%]" speed={7} />
                <Pinwheel className="absolute bottom-0 left-[14%]" speed={9} />
                <Pinwheel className="absolute bottom-0 left-[24%]" speed={9} />
                <Pinwheel className="absolute bottom-0 right-[4%]" speed={6} />
                <Pinwheel
                    className="absolute bottom-0 right-[14%]"
                    speed={10}
                />
                <Pinwheel className="absolute bottom-0 right-[24%]" speed={6} />
            </div>

            <Footer />
        </div>
    );
}
