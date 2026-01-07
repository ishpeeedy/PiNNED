import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import type { Board } from '@/types';

interface NavbarProps {
    board: Board;
    onBoardUpdate?: (updates: Partial<Board>) => void;
}

const Navbar = ({ board, onBoardUpdate }: NavbarProps) => {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editedTitle, setEditedTitle] = useState(board.title);
    const [showUserMenu, setShowUserMenu] = useState(false);

    const handleTitleSave = () => {
        if (editedTitle.trim() && editedTitle !== board.title) {
            onBoardUpdate?.({ title: editedTitle.trim() });
        }
        setIsEditingTitle(false);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="bg-secondary-background border-b-4 border-black p-4 flex items-center justify-between">
            {/* Left: Logo */}
            <div
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            >
                <span className="text-3xl">📌</span>
                <span className="text-xl font-bold">PINNED</span>
            </div>

            {/* Center: Board Name + Settings */}
            <div className="flex items-center gap-3">
                <span className="text-2xl">{board.icon}</span>
                
                {isEditingTitle ? (
                    <input
                        type="text"
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        onBlur={handleTitleSave}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleTitleSave();
                            if (e.key === 'Escape') {
                                setEditedTitle(board.title);
                                setIsEditingTitle(false);
                            }
                        }}
                        autoFocus
                        className="text-2xl font-bold border-4 border-black px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                ) : (
                    <h1
                        onClick={() => setIsEditingTitle(true)}
                        className="text-2xl font-bold cursor-pointer hover:bg-gray-100 px-2 py-1 rounded transition-colors"
                    >
                        {board.title}
                    </h1>
                )}

                {/* Settings Button */}
                <button
                    onClick={() => {/* TODO: Open settings modal */}}
                    className="p-2 hover:bg-gray-200 rounded transition-colors"
                    title="Board settings"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-6 h-6"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
                        />
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                    </svg>
                </button>
            </div>

            {/* Right: User Menu */}
            <div className="relative">
                <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 px-4 py-2 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
                >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold">
                        {user?.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium">{user?.name}</span>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className={`w-4 h-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                        />
                    </svg>
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-50">
                        <div className="p-2 border-b-2 border-black">
                            <p className="text-sm font-medium">{user?.name}</p>
                            <p className="text-xs text-gray-500">{user?.email}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors font-medium"
                        >
                            Logout
                        </button>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
