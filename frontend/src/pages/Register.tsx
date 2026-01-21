import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/footer';
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

export default function Register() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const setAuth = useAuthStore((state) => state.setAuth);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const data = await authAPI.register(email, password, name);
            setAuth(data.user, data.token);
            toast.success('Account created successfully!');
            navigate('/dashboard');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="flex flex-col min-h-screen">
                <Navbar />
                <main className="flex-1 flex items-center justify-center">
                    <Card className="w-full max-w-sm shadow-shadow">
                        <CardHeader>
                            <CardTitle>Create an account</CardTitle>
                            <CardDescription>
                                Enter your information to create your PINNED
                                account
                            </CardDescription>
                        </CardHeader>
                        <form onSubmit={handleSubmit}>
                            <CardContent>
                                <div className="flex flex-col gap-6">
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">Name</Label>
                                        <Input
                                            id="name"
                                            type="text"
                                            placeholder="John Doe"
                                            value={name}
                                            onChange={(e) =>
                                                setName(e.target.value)
                                            }
                                            required
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="email@example.com"
                                            value={email}
                                            onChange={(e) =>
                                                setEmail(e.target.value)
                                            }
                                            required
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="password">
                                            Password
                                        </Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            value={password}
                                            onChange={(e) =>
                                                setPassword(e.target.value)
                                            }
                                            required
                                            minLength={6}
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
                                    {loading
                                        ? 'Creating account...'
                                        : 'Create account'}
                                </Button>
                                <div className="mt-4 text-center text-sm">
                                    Already have an account?{' '}
                                    <Link
                                        to="/login"
                                        className="underline underline-offset-4"
                                    >
                                        Login
                                    </Link>
                                </div>
                            </CardFooter>
                        </form>
                    </Card>
                </main>
                <Footer />
            </div>
        </>
    );
}
