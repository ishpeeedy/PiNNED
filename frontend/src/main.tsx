import { StrictMode, useEffect, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { Toaster } from '@/components/ui/sonner';
import ScrollToTop from './components/ScrollToTop.tsx';
import Loader from './components/Loader.tsx';
import '../global.css';

const Home = lazy(() => import('./pages/Home.tsx'));
const Login = lazy(() => import('./pages/Login.tsx'));
const Register = lazy(() => import('./pages/Register.tsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.tsx'));
const Changelog = lazy(() => import('./pages/Changelog.tsx'));
const Board = lazy(() => import('./pages/Board.tsx'));
const BoardSettings = lazy(() => import('./pages/BoardSettings.tsx'));
const NotFound = lazy(() => import('./pages/NotFound.tsx'));

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
            <Suspense fallback={<Loader />}>
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
