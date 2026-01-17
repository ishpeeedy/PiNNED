// Board type matching backend IBoard
export interface Board {
    _id: string;
    userId: string;
    title: string;
    description?: string;
    icon: string;
    settings: {
        tileColor: string;
        canvasColor: string;
    };
    visibility: 'private' | 'public';
    allowDuplication: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Tile {
    _id: string;
    boardId: string;
    type: 'text' | 'image' | 'link';
    position: {
        x: number;
        y: number;
    };
    size: {
        width: number;
        height: number;
    };
    style: {
        backgroundColor: string;
        textColor: string;
    };
    data: {
        header?: string;
        text?: string;
        imageUrl?: string;
        linkUrl?: string;
        linkTitle?: string;
        linkDescription?: string;
        thumbnailUrl?: string;
    };
    zIndex: number;
    createdAt: string;
    updatedAt: string;
}

export interface User {
    id: string;
    email: string;
    name: string;
}

// Helper types for creating new items (without MongoDB-generated fields)
export interface CreateBoardData {
    title: string;
    description?: string;
    icon?: string;
    settings?: {
        tileColor?: string;
        canvasColor?: string;
    };
    visibility?: 'private' | 'public';
    allowDuplication?: boolean;
}

export interface CreateTileData {
    type: 'text' | 'image' | 'link';
    position?: {
        x: number;
        y: number;
    };
    size?: {
        width: number;
        height: number;
    };
    style?: {
        backgroundColor?: string;
        textColor?: string;
    };
    data: {
        header?: string;
        text?: string;
        imageUrl?: string;
        linkUrl?: string;
        linkTitle?: string;
        linkDescription?: string;
        thumbnailUrl?: string;
    };
    zIndex?: number;
}
