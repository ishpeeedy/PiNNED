import { useState, useRef, useEffect } from 'react';
import type { Tile } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';

interface TextTileProps {
    tile: Tile;
    onUpdate?: (updates: Partial<Tile>) => void;
}

const TextTile = ({ tile, onUpdate }: TextTileProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [header, setHeader] = useState(tile.data?.header || '');
    const [text, setText] = useState(tile.data?.text || '');
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isEditing && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [isEditing]);

    const handleSave = () => {
        setIsEditing(false);
        if (onUpdate) {
            onUpdate({
                data: {
                    ...(tile.data || {}),
                    header: header.trim(),
                    text: text.trim(),
                },
            });
        }
    };

    useEffect(() => {
        if (!isEditing) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(e.target as Node)
            ) {
                handleSave();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isEditing, header, text, onUpdate, tile.data]);

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isEditing) {
            setIsEditing(true);
        }
    };

    return (
        <Card
            ref={containerRef}
            className="h-full w-full cursor-pointer p-0 gap-0"
            style={{ backgroundColor: tile.style.backgroundColor }}
            onClick={handleClick}
        >
            <ScrollArea className="h-full w-full">
                {isEditing ? (
                    <div className="p-1 space-y-2">
                        <input
                            type="text"
                            value={header}
                            onChange={(e) => setHeader(e.target.value)}
                            placeholder="Header (optional)"
                            className="w-full text-lg font-bold bg-transparent border-b-2 border-black outline-none pb-1"
                        />
                        <textarea
                            ref={textareaRef}
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Type your text here..."
                            className="w-full bg-transparent outline-none resize-none min-h-[100px]"
                            rows={8}
                        />
                    </div>
                ) : (
                    <div className="p-1 space-y-2">
                        {header && (
                            <h3 className="text-lg font-bold">{header}</h3>
                        )}
                        <p className="whitespace-pre-wrap">
                            {text || 'Click to edit...'}
                        </p>
                    </div>
                )}
            </ScrollArea>
        </Card>
    );
};

export default TextTile;
