import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { boardAPI } from '@/services/api';
import logo from '@/assets/logo.png';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Search, Clock, Grid3x3, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';
import type { Board } from '@/types';

export default function Dashboard() {
    const navigate = useNavigate();
    const [boards, setBoards] = useState<Board[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchBoards();
    }, []);

    const fetchBoards = async () => {
        try {
            const data = await boardAPI.getBoards();
            setBoards(data);
        } catch (error) {
            console.error('Failed to fetch boards:', error);
            toast.error('Failed to load boards');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateBoard = async () => {
        try {
            const newBoard = await boardAPI.createBoard({
                title: 'Untitled Board',
                settings: {
                    canvasColor: 'oklch(100% 0 0)',
                    tileColor: 'oklch(93.88% 0.033 300.19)',
                },
            });
            navigate(`/board/${newBoard._id}`);
            toast.success('Board created!');
        } catch (error) {
            console.error('Failed to create board:', error);
            toast.error('Failed to create board');
        }
    };

    const handleDeleteBoard = async (boardId: string) => {
        try {
            await boardAPI.deleteBoard(boardId);
            setBoards(boards.filter((b) => b._id !== boardId));
            toast.success('Board deleted');
        } catch (error) {
            console.error('Failed to delete board:', error);
            toast.error('Failed to delete board');
        }
    };

    const filteredBoards = boards.filter((board) =>
        board.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const recentBoards = [...boards]
        .sort(
            (a, b) =>
                new Date(b.updatedAt).getTime() -
                new Date(a.updatedAt).getTime()
        )
        .slice(0, 3);

    const getTimeAgo = (date: string) => {
        const seconds = Math.floor(
            (new Date().getTime() - new Date(date).getTime()) / 1000
        );
        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
        return new Date(date).toLocaleDateString();
    };

    const BoardCard = ({ board }: { board: Board }) => {
        const tileCount = board.tileCount || 0;

        const handleDelete = (e: React.MouseEvent) => {
            e.stopPropagation();
        };

        return (
            <Card
                className="group cursor-pointer shadow-shadow"
                onClick={() => navigate(`/board/${board._id}`)}
            >
                <img src={logo} alt={board.title} />

                <CardHeader className="pb-3">
                    <CardTitle className="text-lg truncate flex-1">
                        {board.title}
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1">
                            <Grid3x3 className="w-3.5 h-3.5" />
                            <span>{tileCount} tiles</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{getTimeAgo(board.updatedAt)}</span>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <button
                                        onClick={handleDelete}
                                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                                        aria-label="Delete board"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-yellow">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>
                                            Delete "{board.title}"?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. This
                                            will permanently delete your board
                                            and all its tiles.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            Cancel
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                            className="bg-yellow-bright hover:bg-yellow-bright"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteBoard(board._id);
                                            }}
                                        >
                                            Delete
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="min-h-screen isometric-dots">
            <Navbar />

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 py-8 relative z-10">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <p className="text-xl">Loading boards...</p>
                    </div>
                ) : (
                    <div className="space-y-12">
                        {/* Create New Board */}
                        <Button
                            onClick={handleCreateBoard}
                            className="w-full h-auto p-8"
                            size="lg"
                        >
                            <div>
                                <h1 className="text-2xl">Create a New Board</h1>
                            </div>
                        </Button>

                        {/* Recent Boards */}
                        {recentBoards.length > 0 && (
                            <section>
                                <div className="flex items-center gap-2 mb-4">
                                    <Clock className="w-5 h-5" />
                                    <h2 className="text-2xl font-heading">
                                        Recent
                                    </h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {recentBoards.map((board) => (
                                        <BoardCard
                                            key={board._id}
                                            board={board}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Search Bar */}
                        <section>
                            <div className="relative max-full">
                                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                                <Input
                                    type="text"
                                    placeholder="Search boards..."
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                    className="pl-12 text-lg h-14"
                                />
                            </div>
                        </section>

                        {/* All Boards */}
                        <section>
                            <div className="flex items-center gap-2 mb-4">
                                <Grid3x3 className="w-5 h-5" />
                                <h2 className="text-2xl font-heading">
                                    {searchQuery
                                        ? 'Search Results'
                                        : 'All Boards'}
                                </h2>
                                <span className="text-gray-600">
                                    ({filteredBoards.length})
                                </span>
                            </div>
                            {filteredBoards.length === 0 ? (
                                <Card className="p-12 text-center">
                                    <p className="text-xl text-gray-600">
                                        {searchQuery
                                            ? 'No boards found'
                                            : 'No boards yet - create your first one!'}
                                    </p>
                                </Card>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {filteredBoards.map((board) => (
                                        <BoardCard
                                            key={board._id}
                                            board={board}
                                        />
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>
                )}
            </div>
        </div>
    );
}
