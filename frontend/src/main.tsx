import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { Toaster } from '@/components/ui/sonner';
import '../global.css';

import Home from './pages/Home.tsx';
import Login from './pages/Login.tsx';
import Register from './pages/Register.tsx';
import Dashboard from './pages/Dashboard.tsx';
import Changelog from './pages/Changelog.tsx';
import Landing from './pages/Landing.tsx';
import Board from './pages/Board.tsx';

import { useAuthStore } from './stores/authStore';

function App() {
    const { isAuthenticated, checkAuth } = useAuthStore();

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    return (
        <>
            <Toaster position="bottom-right" />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route
                    path="/login"
                    element={
                        isAuthenticated ? (
                            <Navigate to="/dashboard" />
                        ) : (
                            <Login />
                        )
                    }
                />
                <Route
                    path="/register"
                    element={
                        isAuthenticated ? (
                            <Navigate to="/dashboard" />
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
                            <Navigate to="/login" />
                        )
                    }
                />
                <Route path="/landing" element={<Landing />} />
                <Route path="/changelog" element={<Changelog />} />
                <Route
                    path="/board/:id"
                    element={
                        isAuthenticated ? <Board /> : <Navigate to="/login" />
                    }
                />
                <Route path="*" element={<Home />} />
            </Routes>
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
