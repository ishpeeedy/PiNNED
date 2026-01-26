import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Moon, Sun } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';
import { Input } from '@/components/ui/input';
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
import logo from '@/assets/logo.svg';

interface NavbarProps {
    board?: Board | null;
    onBoardUpdate?: (updates: Partial<Board>) => void;
}

const Navbar = ({ board, onBoardUpdate }: NavbarProps) => {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const { isDark, toggle } = useThemeStore();
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
        <nav className="bg-secondary-background border-b-4 border-black px-6 h-[60px] flex items-center justify-between gap-4 relative z-10">
            {/* Left: Logo */}
            <div
                onClick={() => navigate('/')}
                className="flex items-center cursor-pointer"
            >
                <img src={logo} alt="PINNED" className="w-auto h-[50px]" />
            </div>

            {/* Center: Board Name + Settings (only show on board pages) */}
            {board && (
                <div className="flex-1 flex items-center justify-center gap-3">
                    {isEditingTitle ? (
                        <div className="relative max-w-md w-full">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xl">
                                {board.icon}
                            </span>
                            <Input
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
                                className="pl-10"
                            />
                        </div>
                    ) : (
                        <div
                            className="relative max-w-md w-full"
                            onClick={() => setIsEditingTitle(true)}
                        >
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xl">
                                {board.icon}
                            </span>
                            <Input
                                type="text"
                                value={board.title}
                                readOnly
                                className="pl-10 cursor-text"
                            />
                        </div>
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

            {/* Right: Dark Mode + User Menu */}
            <div className="flex items-center gap-3">
                {/* Dark Mode Toggle */}
                <button
                    onClick={toggle}
                    className="p-2 hover:bg-black/5 rounded-base transition-colors"
                    title={
                        isDark ? 'Switch to light mode' : 'Switch to dark mode'
                    }
                >
                    {isDark ? (
                        <Sun className="w-5 h-5" />
                    ) : (
                        <Moon className="w-5 h-5" />
                    )}
                </button>

                {/* User Menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center gap-2 outline-none">
                        <Avatar>
                            <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-400 text-white font-bold">
                                {user?.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user?.name}</span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>
                            <div className="flex flex-col">
                                <p className="text-sm font-medium">
                                    {user?.name}
                                </p>
                                <p className="text-xs">{user?.email}</p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout}>
                            Logout
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </nav>
    );
};

export default Navbar;
