import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function Home() {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <Navbar />

            <main className="flex-1">
                {/* Hero Section */}
                <section className="hero-section py-20 px-6 text-center isometric-dots">
                    <div className="max-w-4xl mx-auto space-y-6">
                        <h1 className="text-6xl font-black text-foreground">
                            Pin Your Ideas. Organize Your World.
                        </h1>
                        <p className="text-2xl text-foreground/80">
                            A visual workspace where your thoughts, links, and
                            images come together on an infinite canvas. No
                            clutter. No limits. Just pure creative freedom.
                        </p>
                        <div className="flex gap-4 justify-center pt-6">
                            <Button
                                onClick={() => navigate('/register')}
                                className="text-lg px-8 py-6"
                            >
                                Get Started Free
                            </Button>
                            <Button
                                onClick={() => navigate('/demo')}
                                className="text-lg px-8 py-6"
                            >
                                See Demo
                            </Button>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="features-section py-20 px-6 ">
                    <div className="max-w-6xl mx-auto">
                        <h2 className="text-4xl font-black text-center mb-12 text-foreground">
                            Why PINNED?
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <Card className="p-6 shadow-shadow">
                                <h3 className="text-2xl font-bold mb-3">
                                    Infinite Canvas
                                </h3>
                                <p className="text-foreground/80">
                                    Drag, drop, and organize anywhere. Your
                                    board grows with your ideas—up, down, left,
                                    right. No boundaries.
                                </p>
                            </Card>

                            <Card className="p-6 shadow-shadow">
                                <h3 className="text-2xl font-bold mb-3">
                                    Multiple Tile Types
                                </h3>
                                <p className="text-foreground/80">
                                    Text notes, images, links with previews.
                                    Everything you need in one place.
                                </p>
                            </Card>

                            <Card className="p-6 shadow-shadow">
                                <h3 className="text-2xl font-bold mb-3">
                                    Effortless Organization
                                </h3>
                                <p className="text-foreground/80">
                                    Snap-to-grid keeps things tidy. Zoom in for
                                    details, zoom out for the big picture.
                                </p>
                            </Card>

                            <Card className="p-6 shadow-shadow">
                                <h3 className="text-2xl font-bold mb-3">
                                    Undo Everything
                                </h3>
                                <p className="text-foreground/80">
                                    Made a mistake? No problem. Full undo/redo
                                    history has your back.
                                </p>
                            </Card>

                            <Card className="p-6 shadow-shadow">
                                <h3 className="text-2xl font-bold mb-3">
                                    Beautiful Design
                                </h3>
                                <p className="text-foreground/80">
                                    Bold, colorful, and unapologetically simple.
                                    Neobrutalist design that gets out of your
                                    way.
                                </p>
                            </Card>
                        </div>
                    </div>
                </section>

                {/* How It Works */}
                <section className="how-it-works-section py-20 px-6 grid-pattern-tight">
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-4xl font-black text-center mb-12 text-foreground">
                            How It Works
                        </h2>
                        <div className="space-y-8">
                            <div className="flex items-start gap-4">
                                <div className="text-3xl font-black text-foreground">
                                    1.
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold mb-2">
                                        Create a board
                                    </h3>
                                    <p className="text-foreground/80">
                                        Start with a blank canvas, ready for
                                        your ideas.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="text-3xl font-black text-foreground">
                                    2.
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold mb-2">
                                        Add tiles (text, images, links)
                                    </h3>
                                    <p className="text-foreground/80">
                                        Choose from multiple tile types to
                                        capture your content.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="text-3xl font-black text-foreground">
                                    3.
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold mb-2">
                                        Drag, resize, and organize
                                    </h3>
                                    <p className="text-foreground/80">
                                        Move things around until they feel just
                                        right.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="text-3xl font-black text-foreground">
                                    4.
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold mb-2">
                                        Your board auto-saves. Done.
                                    </h3>
                                    <p className="text-foreground/80">
                                        Never worry about losing your work
                                        again.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Use Cases */}
                <section className="use-cases-section py-20 px-6 ">
                    <div className="max-w-6xl mx-auto">
                        <h2 className="text-4xl font-black text-center mb-12 text-foreground">
                            Who Uses PINNED?
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="p-6 shadow-shadow">
                                <h3 className="text-2xl font-bold mb-3">
                                    For Students
                                </h3>
                                <p className="text-foreground/80">
                                    Research boards, study notes, project
                                    planning
                                </p>
                            </Card>

                            <Card className="p-6 shadow-shadow">
                                <h3 className="text-2xl font-bold mb-3">
                                    For Designers
                                </h3>
                                <p className="text-foreground/80">
                                    Mood boards, inspiration collection, client
                                    feedback
                                </p>
                            </Card>

                            <Card className="p-6 shadow-shadow">
                                <h3 className="text-2xl font-bold mb-3">
                                    For Writers
                                </h3>
                                <p className="text-foreground/80">
                                    Story outlines, character notes, reference
                                    materials
                                </p>
                            </Card>

                            <Card className="p-6 shadow-shadow">
                                <h3 className="text-2xl font-bold mb-3">
                                    For Everyone
                                </h3>
                                <p className="text-foreground/80">
                                    Task lists, recipes, travel plans, literally
                                    anything
                                </p>
                            </Card>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="cta-section py-20 px-6 text-center grid-pattern-tight">
                    <div className="max-w-2xl mx-auto space-y-6">
                        <h2 className="text-4xl font-black text-foreground">
                            Ready to organize your world?
                        </h2>
                        <Button
                            onClick={() => navigate('/register')}
                            className="text-lg px-8 py-6"
                        >
                            Get Started Free
                        </Button>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}
