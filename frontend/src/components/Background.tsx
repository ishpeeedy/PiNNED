interface BackgroundProps {
    children: React.ReactNode;
    color?: string;
}

export default function Background({ children }: BackgroundProps) {
    return (
        <div
            className="relative min-h-screen"
        >
            {/* Light mode grid */}
            <div
                className="absolute inset-0 pointer-events-none dark:hidden"
                style={{
                    backgroundColor: 'var(--secondary-background)',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Cpath d='M0 0h40v40H0z' fill='none'/%3E%3Cpath d='M0 0h1v40H0zM0 0h40v1H0z' fill='rgba(0,0,0,0.05)'/%3E%3C/svg%3E")`,
                    backgroundSize: '40px 40px',
                }}
            />
            {/* Dark mode grid overlay */}
            <div
                className="absolute inset-0 pointer-events-none hidden dark:block"
                style={{
                    backgroundColor: 'var(--secondary-background)',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Cpath d='M0 0h40v40H0z' fill='none'/%3E%3Cpath d='M0 0h1v40H0zM0 0h40v1H0z' fill='rgba(255,255,255,0.1)'/%3E%3C/svg%3E")`,
                    backgroundSize: '40px 40px',
                }}
            />
            <div className="relative">
                {children}
            </div>
        </div>
    );
}
