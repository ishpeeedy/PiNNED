import { Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ColorPaletteProps {
    onColorChange: (color: string) => void;
    disabled?: boolean;
}

const PRESET_COLORS = [
    { name: 'Yellow', value: '#FBBF24' },
    { name: 'Pink', value: '#F472B6' },
    { name: 'Blue', value: '#60A5FA' },
    { name: 'Green', value: '#4ADE80' },
    { name: 'Purple', value: '#C084FC' },
    { name: 'Orange', value: '#FB923C' },
    { name: 'Red', value: '#F87171' },
    { name: 'White', value: '#FFFFFF' },
];

export default function ColorPalette({
    onColorChange,
    disabled,
}: ColorPaletteProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="neutral"
                    size="icon"
                    disabled={disabled}
                    title={
                        disabled
                            ? 'Select a tile to change its color'
                            : 'Change tile color'
                    }
                >
                    <Palette className="h-5 w-5" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="p-3">
                <div className="grid grid-cols-4 gap-2">
                    {PRESET_COLORS.map((color) => (
                        <button
                            key={color.value}
                            className="w-12 h-12 rounded-base border-2 border-border hover:scale-110 transition-transform shadow-shadow cursor-pointer"
                            style={{ backgroundColor: color.value }}
                            onClick={() => onColorChange(color.value)}
                            title={color.name}
                            aria-label={`Set color to ${color.name}`}
                        />
                    ))}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
