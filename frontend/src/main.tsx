import { StrictMode, useEffect, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { Toaster } from '@/components/ui/sonner';
import ScrollToTop from './components/ScrollToTop.tsx';
import Loader from './components/Loader.tsx';
import '../global.css';

import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Changelog from './pages/Changelog';
import NotFound from './pages/NotFound.tsx';

const BoardSettings = lazy(() => import('./pages/BoardSettings'));
const Board = lazy(() => import('./pages/Board'));

import { useAuthStore } from './stores/authStore';

function App() {
    const { isAuthenticated, checkAuth } = useAuthStore();

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    return (
        <>
            <ScrollToTop />
            <Toaster position="bottom-right" />
            <Suspense
                fallback={
                    <div className="min-h-screen flex items-center justify-center">
                        <Loader />
                    </div>
                }
            >
                {' '}
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route
                        path="/login"
                        element={
                            isAuthenticated ? (
                                <Navigate to="/dashboard" replace />
                            ) : (
                                <Login />
                            )
                        }
                    />
                    <Route
                        path="/register"
                        element={
                            isAuthenticated ? (
                                <Navigate to="/dashboard" replace />
                            ) : (
                                <Register />
                            )
                        }
                    />
                    <Route
                        path="/dashboard"
                        element={
                            isAuthenticated ? (
                                <Dashboard />
                            ) : (
                                <Navigate to="/login" replace />
                            )
                        }
                    />
                    <Route path="/changelog" element={<Changelog />} />
                    <Route
                        path="/board/:id"
                        element={
                            isAuthenticated ? (
                                <Board />
                            ) : (
                                <Navigate to="/login" replace />
                            )
                        }
                    />
                    <Route
                        path="/board/:id/settings"
                        element={
                            isAuthenticated ? (
                                <BoardSettings />
                            ) : (
                                <Navigate to="/login" replace />
                            )
                        }
                    />
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </Suspense>
        </>
    );
}

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </StrictMode>
);
