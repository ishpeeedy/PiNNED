import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Calendar,
    Clock,
    Download,
    Image as ImageIcon,
    Link as LinkIcon,
    Type,
    X,
    ArrowUpDown,
    ExternalLink,
} from 'lucide-react';
import {
    type ColumnDef,
    type ColumnFiltersState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    type SortingState,
    useReactTable,
} from '@tanstack/react-table';
import { boardAPI, tileAPI } from '@/services/api';
import type { Board, Tile, BoardBackground } from '@/types';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

/* ------------------------------------------------------------------ */
/*  Background type picker options                                     */
/* ------------------------------------------------------------------ */
const BG_OPTIONS: {
    value: BoardBackground['type'];
    label: string;
    desc: string;
}[] = [
    { value: 'grid', label: 'Grid', desc: 'Clean grid lines' },
    { value: 'dots', label: 'Isometric Dots', desc: 'Dot pattern' },
    { value: 'solid', label: 'Solid Color', desc: 'Plain background' },
    { value: 'image', label: 'Custom Image', desc: 'Upload an image' },
];

/* ------------------------------------------------------------------ */
/*  Link columns for TanStack table                                    */
/* ------------------------------------------------------------------ */
interface LinkRow {
    id: string;
    title: string;
    url: string;
    description: string;
    createdAt: string;
}

const linkColumns: ColumnDef<LinkRow>[] = [
    {
        accessorKey: 'title',
        header: ({ column }) => (
            <Button
                variant="noShadow"
                size="sm"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
            >
                Title
                <ArrowUpDown />
            </Button>
        ),
        cell: ({ row }) => (
            <span className="font-medium">{row.getValue('title') || '—'}</span>
        ),
    },
    {
        accessorKey: 'url',
        header: 'URL',
        cell: ({ row }) => {
            const url = row.getValue('url') as string;
            return url ? (
                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline inline-flex items-center gap-1 max-w-[300px] truncate"
                >
                    {url}
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                </a>
            ) : (
                '—'
            );
        },
    },
    {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row }) => (
            <span className="max-w-[250px] truncate block">
                {row.getValue('description') || '—'}
            </span>
        ),
    },
    {
        accessorKey: 'createdAt',
        header: ({ column }) => (
            <Button
                variant="noShadow"
                size="sm"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
            >
                Added
                <ArrowUpDown />
            </Button>
        ),
        cell: ({ row }) =>
            new Date(row.getValue('createdAt')).toLocaleDateString(),
    },
];

/* ================================================================== */
/*  BoardSettings page                                                 */
/* ================================================================== */
const BoardSettings = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [board, setBoard] = useState<Board | null>(null);
    const [tiles, setTiles] = useState<Tile[]>([]);
    const [loading, setLoading] = useState(true);

    /* ---- title editing ---- */
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editedTitle, setEditedTitle] = useState('');

    /* ---- background settings ---- */
    const [bgType, setBgType] = useState<BoardBackground['type']>('grid');
    const [bgColor, setBgColor] = useState('');
    const [bgFg, setBgFg] = useState('');
    const [bgImageUrl, setBgImageUrl] = useState('');

    /* ---- image lightbox ---- */
    const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

    /* ---- link table state ---- */
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

    /* ---------------------------------------------------------------- */
    /*  Fetch board + tiles                                              */
    /* ---------------------------------------------------------------- */
    useEffect(() => {
        const fetch = async () => {
            if (!id) return;
            try {
                const [b, t] = await Promise.all([
                    boardAPI.getBoard(id),
                    tileAPI.getTiles(id),
                ]);
                setBoard(b);
                setTiles(t);
                setEditedTitle(b.title);
                // Populate background fields
                const bg = b.settings?.background;
                setBgType(bg?.type ?? 'grid');
                setBgColor(bg?.color ?? '');
                setBgFg(bg?.foregroundColor ?? '');
                setBgImageUrl(bg?.imageUrl ?? '');
            } catch {
                toast.error('Failed to load board');
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [id]);

    /* ---------------------------------------------------------------- */
    /*  Derived tile lists                                               */
    /* ---------------------------------------------------------------- */
    const imageTiles = useMemo(
        () => tiles.filter((t) => t.type === 'image'),
        [tiles]
    );
    const textTiles = useMemo(
        () => tiles.filter((t) => t.type === 'text'),
        [tiles]
    );
    const linkRows: LinkRow[] = useMemo(
        () =>
            tiles
                .filter((t) => t.type === 'link')
                .map((t) => ({
                    id: t._id,
                    title: t.data.linkTitle ?? '',
                    url: t.data.linkUrl ?? '',
                    description: t.data.linkDescription ?? '',
                    createdAt: t.createdAt,
                })),
        [tiles]
    );

    /* ---------------------------------------------------------------- */
    /*  TanStack table instance                                          */
    /* ---------------------------------------------------------------- */
    const table = useReactTable({
        data: linkRows,
        columns: linkColumns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        state: { sorting, columnFilters },
    });

    /* ---------------------------------------------------------------- */
    /*  Handlers                                                         */
    /* ---------------------------------------------------------------- */
    const saveTitle = async () => {
        if (!id || !board) return;
        const trimmed = editedTitle.trim();
        if (!trimmed || trimmed === board.title) {
            setEditedTitle(board.title);
            setIsEditingTitle(false);
            return;
        }
        try {
            const updated = await boardAPI.updateBoard(id, { title: trimmed });
            setBoard(updated);
            toast.success('Title updated');
        } catch {
            toast.error('Failed to update title');
        }
        setIsEditingTitle(false);
    };

    const saveBackground = async () => {
        if (!id || !board) return;
        const background: BoardBackground = {
            type: bgType,
            ...(bgColor && { color: bgColor }),
            ...(bgFg && { foregroundColor: bgFg }),
            ...(bgImageUrl && { imageUrl: bgImageUrl }),
        };
        try {
            const updated = await boardAPI.updateBoard(id, {
                settings: { ...board.settings, background },
            });
            setBoard(updated);
            toast.success('Background updated');
        } catch {
            toast.error('Failed to update background');
        }
    };

    /* ---------------------------------------------------------------- */
    /*  Loading / error states                                           */
    /* ---------------------------------------------------------------- */
    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-2xl">Loading settings...</p>
            </div>
        );
    }

    if (!board) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-2xl">Board not found</p>
            </div>
        );
    }

    /* ---------------------------------------------------------------- */
    /*  Render                                                           */
    /* ---------------------------------------------------------------- */
    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />

            <main className="flex-1 grid-pattern">
                <div className="max-w-4xl mx-auto px-6 py-10 space-y-10">
                    {/* Back button */}
                    <Button
                        variant="neutral"
                        onClick={() => navigate(`/board/${id}`)}
                        className="gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to board
                    </Button>

                    {/* ================================================ */}
                    {/*  Section 1 — Board Info                           */}
                    {/* ================================================ */}
                    <section className="space-y-4">
                        <h2 className="text-2xl font-heading">Board Info</h2>
                        <Card>
                            <CardContent className="p-6 space-y-4">
                                {/* Title */}
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-foreground/60">
                                        Title
                                    </label>
                                    {isEditingTitle ? (
                                        <Input
                                            value={editedTitle}
                                            onChange={(e) =>
                                                setEditedTitle(e.target.value)
                                            }
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter')
                                                    saveTitle();
                                                if (e.key === 'Escape') {
                                                    setEditedTitle(board.title);
                                                    setIsEditingTitle(false);
                                                }
                                            }}
                                            autoFocus
                                            className="text-lg font-heading"
                                        />
                                    ) : (
                                        <div
                                            onClick={() =>
                                                setIsEditingTitle(true)
                                            }
                                            className="text-lg font-heading cursor-text px-3 py-2 border-2 border-transparent hover:border-border rounded-base transition-colors"
                                        >
                                            {board.icon} {board.title}
                                        </div>
                                    )}
                                </div>

                                {/* Dates */}
                                <div className="flex gap-8 text-sm text-foreground/60">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        Created{' '}
                                        {new Date(
                                            board.createdAt
                                        ).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        Modified{' '}
                                        {new Date(
                                            board.updatedAt
                                        ).toLocaleDateString()}
                                    </div>
                                </div>

                                {/* Export (dummy) */}
                                <Button
                                    variant="neutral"
                                    disabled
                                    className="gap-2 opacity-50"
                                    title="Coming soon"
                                >
                                    <Download className="w-4 h-4" />
                                    Export Board
                                </Button>
                            </CardContent>
                        </Card>
                    </section>

                    {/* ================================================ */}
                    {/*  Section 2 — Board Theme                          */}
                    {/* ================================================ */}
                    <section className="space-y-4">
                        <h2 className="text-2xl font-heading">Board Theme</h2>
                        <Card>
                            <CardContent className="p-6 space-y-6">
                                {/* Type picker */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {BG_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.value}
                                            onClick={() => setBgType(opt.value)}
                                            className={`flex flex-col items-center gap-2 p-4 rounded-base border-2 transition-all cursor-pointer ${
                                                bgType === opt.value
                                                    ? 'border-main bg-main/10 shadow-shadow'
                                                    : 'border-border hover:border-main/50'
                                            }`}
                                        >
                                            {/* Preview swatch */}
                                            <div
                                                className={`w-full h-16 rounded-base border-2 border-border ${
                                                    opt.value === 'grid'
                                                        ? 'grid-pattern'
                                                        : opt.value === 'dots'
                                                          ? 'isometric-dots'
                                                          : opt.value ===
                                                              'image'
                                                            ? 'bg-gradient-to-br from-purple-200 to-pink-200'
                                                            : ''
                                                }`}
                                                style={
                                                    opt.value === 'solid'
                                                        ? {
                                                              backgroundColor:
                                                                  bgColor ||
                                                                  'var(--secondary-background)',
                                                          }
                                                        : undefined
                                                }
                                            />
                                            <span className="font-medium text-sm">
                                                {opt.label}
                                            </span>
                                            <span className="text-xs text-foreground/50">
                                                {opt.desc}
                                            </span>
                                        </button>
                                    ))}
                                </div>

                                {/* Conditional color pickers */}
                                {(bgType === 'solid' ||
                                    bgType === 'grid' ||
                                    bgType === 'dots') && (
                                    <div className="flex flex-wrap gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">
                                                Background Color
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="color"
                                                    value={bgColor || '#ffffff'}
                                                    onChange={(e) =>
                                                        setBgColor(
                                                            e.target.value
                                                        )
                                                    }
                                                    className="w-10 h-10 rounded-base border-2 border-border cursor-pointer"
                                                />
                                                <Input
                                                    value={bgColor}
                                                    onChange={(e) =>
                                                        setBgColor(
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="Default"
                                                    className="w-32"
                                                />
                                            </div>
                                        </div>
                                        {(bgType === 'grid' ||
                                            bgType === 'dots') && (
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">
                                                    {bgType === 'grid'
                                                        ? 'Line Color'
                                                        : 'Dot Color'}
                                                </label>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="color"
                                                        value={
                                                            bgFg || '#000000'
                                                        }
                                                        onChange={(e) =>
                                                            setBgFg(
                                                                e.target.value
                                                            )
                                                        }
                                                        className="w-10 h-10 rounded-base border-2 border-border cursor-pointer"
                                                    />
                                                    <Input
                                                        value={bgFg}
                                                        onChange={(e) =>
                                                            setBgFg(
                                                                e.target.value
                                                            )
                                                        }
                                                        placeholder="Default"
                                                        className="w-32"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Image URL input */}
                                {bgType === 'image' && (
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">
                                            Image URL
                                        </label>
                                        <Input
                                            value={bgImageUrl}
                                            onChange={(e) =>
                                                setBgImageUrl(e.target.value)
                                            }
                                            placeholder="https://..."
                                        />
                                        {bgImageUrl && (
                                            <img
                                                src={bgImageUrl}
                                                alt="Preview"
                                                className="w-full max-h-40 object-cover rounded-base border-2 border-border mt-2"
                                            />
                                        )}
                                    </div>
                                )}

                                <Button
                                    onClick={saveBackground}
                                    className="gap-2"
                                >
                                    Save Theme
                                </Button>
                            </CardContent>
                        </Card>
                    </section>

                    {/* ================================================ */}
                    {/*  Section 3 — Image Gallery                        */}
                    {/* ================================================ */}
                    <section className="space-y-4">
                        <h2 className="text-2xl font-heading flex items-center gap-2">
                            <ImageIcon className="w-6 h-6" />
                            Images
                            <span className="text-sm font-base text-foreground/50">
                                ({imageTiles.length})
                            </span>
                        </h2>

                        {imageTiles.length === 0 ? (
                            <Card>
                                <CardContent className="p-10 text-center text-foreground/50">
                                    No image tiles on this board yet.
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {imageTiles.map((tile) => (
                                    <div
                                        key={tile._id}
                                        className="cursor-pointer group"
                                        onClick={() =>
                                            setLightboxSrc(
                                                tile.data.imageUrl ?? null
                                            )
                                        }
                                    >
                                        <Card className="overflow-hidden">
                                            <img
                                                src={tile.data.imageUrl}
                                                alt={
                                                    tile.data.caption ||
                                                    'Board image'
                                                }
                                                className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-200"
                                            />
                                            {tile.data.caption && (
                                                <CardContent className="p-2 text-xs truncate">
                                                    {tile.data.caption}
                                                </CardContent>
                                            )}
                                        </Card>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* ================================================ */}
                    {/*  Section 4 — Links Table                          */}
                    {/* ================================================ */}
                    <section className="space-y-4">
                        <h2 className="text-2xl font-heading flex items-center gap-2">
                            <LinkIcon className="w-6 h-6" />
                            Links
                            <span className="text-sm font-base text-foreground/50">
                                ({linkRows.length})
                            </span>
                        </h2>

                        {linkRows.length === 0 ? (
                            <Card>
                                <CardContent className="p-10 text-center text-foreground/50">
                                    No link tiles on this board yet.
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="w-full font-base text-foreground space-y-4">
                                {/* Filter input */}
                                <Input
                                    placeholder="Search links..."
                                    value={
                                        (table
                                            .getColumn('title')
                                            ?.getFilterValue() as string) ?? ''
                                    }
                                    onChange={(e) =>
                                        table
                                            .getColumn('title')
                                            ?.setFilterValue(e.target.value)
                                    }
                                    className="max-w-sm"
                                />

                                {/* Table */}
                                <Table>
                                    <TableHeader className="font-heading">
                                        {table
                                            .getHeaderGroups()
                                            .map((headerGroup) => (
                                                <TableRow
                                                    key={headerGroup.id}
                                                    className="bg-secondary-background text-foreground"
                                                >
                                                    {headerGroup.headers.map(
                                                        (header) => (
                                                            <TableHead
                                                                key={header.id}
                                                                className="text-foreground"
                                                            >
                                                                {header.isPlaceholder
                                                                    ? null
                                                                    : flexRender(
                                                                          header
                                                                              .column
                                                                              .columnDef
                                                                              .header,
                                                                          header.getContext()
                                                                      )}
                                                            </TableHead>
                                                        )
                                                    )}
                                                </TableRow>
                                            ))}
                                    </TableHeader>
                                    <TableBody>
                                        {table.getRowModel().rows?.length ? (
                                            table
                                                .getRowModel()
                                                .rows.map((row) => (
                                                    <TableRow
                                                        key={row.id}
                                                        className="bg-secondary-background text-foreground"
                                                    >
                                                        {row
                                                            .getVisibleCells()
                                                            .map((cell) => (
                                                                <TableCell
                                                                    key={
                                                                        cell.id
                                                                    }
                                                                >
                                                                    {flexRender(
                                                                        cell
                                                                            .column
                                                                            .columnDef
                                                                            .cell,
                                                                        cell.getContext()
                                                                    )}
                                                                </TableCell>
                                                            ))}
                                                    </TableRow>
                                                ))
                                        ) : (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={linkColumns.length}
                                                    className="h-24 text-center"
                                                >
                                                    No results.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>

                                {/* Pagination */}
                                <div className="flex items-center justify-end space-x-2 py-2">
                                    <span className="text-sm text-foreground/50">
                                        {
                                            table.getFilteredRowModel().rows
                                                .length
                                        }{' '}
                                        link(s)
                                    </span>
                                    <Button
                                        variant="noShadow"
                                        size="sm"
                                        onClick={() => table.previousPage()}
                                        disabled={!table.getCanPreviousPage()}
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        variant="noShadow"
                                        size="sm"
                                        onClick={() => table.nextPage()}
                                        disabled={!table.getCanNextPage()}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </section>

                    {/* ================================================ */}
                    {/*  Section 5 — Text Tiles                           */}
                    {/* ================================================ */}
                    <section className="space-y-4 pb-10">
                        <h2 className="text-2xl font-heading flex items-center gap-2">
                            <Type className="w-6 h-6" />
                            Text Tiles
                            <span className="text-sm font-base text-foreground/50">
                                ({textTiles.length})
                            </span>
                        </h2>

                        {textTiles.length === 0 ? (
                            <Card>
                                <CardContent className="p-10 text-center text-foreground/50">
                                    No text tiles on this board yet.
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {textTiles.map((tile) => (
                                    <Card key={tile._id}>
                                        <CardContent className="p-4 space-y-1">
                                            <h3 className="font-heading text-lg">
                                                {tile.data.header || 'Untitled'}
                                            </h3>
                                            <p className="text-sm text-foreground/70 line-clamp-3">
                                                {tile.data.text || 'No content'}
                                            </p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </main>

            {/* Lightbox overlay */}
            {lightboxSrc && (
                <div
                    className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-8"
                    onClick={() => setLightboxSrc(null)}
                >
                    <button
                        onClick={() => setLightboxSrc(null)}
                        className="absolute top-6 right-6 text-white hover:text-white/70 transition-colors cursor-pointer"
                    >
                        <X className="w-8 h-8" />
                    </button>
                    <img
                        src={lightboxSrc}
                        alt="Full size"
                        className="max-w-full max-h-full object-contain rounded-base border-4 border-white/20"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
};

export default BoardSettings;
