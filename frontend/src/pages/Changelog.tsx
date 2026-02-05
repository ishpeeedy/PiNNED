import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Pinwheel from '@/components/pinwheel/Pinwheel';

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { changelogData } from '@/data/changelogData';
import { Expand } from 'lucide-react';

export default function Changelog() {
    const [openItems, setOpenItems] = useState<string[]>([]);
    const allVersions = changelogData.map((e) => e.version);
    const allOpen = openItems.length === allVersions.length;

    const handleBackToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1 grid-pattern">
                <div className="max-w-xl mx-auto px-4 py-8">
                    <div className="mb-2">
                        <Button
                            className="w-full hover:bg-main hover:text-main-foreground mb-3"
                            variant="neutral"
                            onClick={() =>
                                setOpenItems(allOpen ? [] : allVersions)
                            }
                        >
                            {allOpen ? 'Collapse All' : <Expand />}
                        </Button>
                    </div>
                    <Accordion
                        type="multiple"
                        value={openItems}
                        onValueChange={setOpenItems}
                        className="w-full"
                    >
                        {changelogData.map((entry) => (
                            <AccordionItem
                                key={entry.version}
                                value={entry.version}
                            >
                                <AccordionTrigger>
                                    v{entry.version} · {entry.date}
                                </AccordionTrigger>
                                <AccordionContent>
                                    <ul className="list-disc list-inside space-y-1">
                                        {entry.changes.map((change, i) => (
                                            <li key={i}>{change}</li>
                                        ))}
                                    </ul>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                    <Button
                        className="w-full hover:bg-main hover:text-main-foreground mt-5"
                        variant="neutral"
                        onClick={() => setOpenItems(allOpen ? [] : allVersions)}
                    >
                        {allOpen ? 'Collapse All' : <Expand />}
                    </Button>
                    <a
                        href="https://github.com/ishpeeedy/PiNNED"
                        className="underline text-xl flex justify-center items-center mt-6 "
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <span className="font-bold uppercase">
                            Click Here to Open the Github Repository
                        </span>
                        <svg viewBox="0 0 13 20" className="w-4 h-4">
                            <polyline points="0.5 19.5 3 19.5 12.5 10 3 0.5" />
                        </svg>
                    </a>
                </div>

                {/* Sticky row — pinwheels + back to top button */}
                <div
                    className="sticky bottom-0 w-full h-0 pointer-events-none z-[1] hidden lg:block"
                    aria-hidden="true"
                >
                    <Pinwheel
                        className="absolute bottom-0 left-[4%]"
                        speed={7}
                    />
                    <Pinwheel
                        className="absolute bottom-0 left-[14%]"
                        speed={9}
                    />
                    <Pinwheel
                        className="absolute bottom-0 right-[4%]"
                        speed={6}
                    />
                    <Pinwheel
                        className="absolute bottom-0 left-[24%]"
                        speed={9}
                    />
                    <Pinwheel
                        className="absolute bottom-0 right-[24%]"
                        speed={6}
                    />
                    <Pinwheel
                        className="absolute bottom-0 right-[14%]"
                        speed={10}
                    />
                    <Button
                        onClick={handleBackToTop}
                        className="absolute bottom-10 right-30 pointer-events-auto z-[2]"
                        aria-label="Back to Top"
                        aria-hidden="false"
                    >
                        ↑
                    </Button>
                </div>
            </main>
            <Footer />
        </div>
    );
}
