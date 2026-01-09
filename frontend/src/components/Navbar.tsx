import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Board } from '@/types';
import logo from '@/assets/logo.png';

interface NavbarProps {
    board?: Board | null;
    onBoardUpdate?: (updates: Partial<Board>) => void;
}

const Navbar = ({ board, onBoardUpdate }: NavbarProps) => {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editedTitle, setEditedTitle] = useState(board?.title || '');

    const handleTitleSave = () => {
        if (board && editedTitle.trim() && editedTitle !== board.title) {
            onBoardUpdate?.({ title: editedTitle.trim() });
        }
        setIsEditingTitle(false);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="bg-secondary-background border-b-4 border-black px-6 py-1 flex items-center justify-between">
            {/* Left: Logo */}
            <div
                onClick={() => navigate('/dashboard')}
                className="flex items-center cursor-pointer"
            >
                <img src={logo} alt="PINNED" className="w-auto h-[50px]" />
            </div>

            {/* Center: Board Name + Settings (only show on board pages) */}
            {board && (
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
                            onFocus={(e) => e.target.select()}
                            autoFocus
                            className="text-2xl font-bold px-2 py-1 bg-gray-100 rounded w-2xl focus:outline-none"
                        />
                    ) : (
                        <h1
                            onClick={() => setIsEditingTitle(true)}
                            className="text-2xl font-bold cursor-text px-2 py-1 bg-gray-100  rounded transition-colors hover:bg-gray-100 w-2xl truncate"
                        >
                            {board.title}
                        </h1>
                    )}

                    {/* Settings Button */}
                    <button
                        onClick={() => {
                            /* TODO: Open settings modal */
                        }}
                        className="p-2 cursor-pointer"
                        title="Board settings"
                    >
                        <Settings className="w-6 h-6" />
                    </button>
                </div>
            )}

            {/* Right: User Menu */}
            <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 outline-none">
                    <Avatar>
                        <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white font-bold">
                            {user?.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{user?.name}</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>
                        <div className="flex flex-col">
                            <p className="text-sm font-medium">{user?.name}</p>
                            <p className="text-xs">{user?.email}</p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                        Logout
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </nav>
    );
};

export default Navbar;
