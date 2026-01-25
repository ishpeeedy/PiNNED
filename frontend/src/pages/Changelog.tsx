import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
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

    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1">
                <div className="max-w-xl mx-auto px-4 py-8">
                    <div className="mb-2">
                        <Button
                            className="w-full hover:bg-main hover:text-main-foreground"
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
                        className="w-full hover:bg-main hover:text-main-foreground"
                        variant="neutral"
                        onClick={() => setOpenItems(allOpen ? [] : allVersions)}
                    >
                        {allOpen ? 'Collapse All' : <Expand />}
                    </Button>
                    <a
                        href="https://github.com/ishpeeedy/PiNNED"
                        className="underline flex justify-center items-center mt-6 color:var(--foreground)"
                    >
                        <span>Github Repository</span>
                        <svg viewBox="0 0 13 20" className="w-4 h-4">
                            <polyline points="0.5 19.5 3 19.5 12.5 10 3 0.5" />
                        </svg>
                    </a>
                </div>
            </main>
            <Footer />
        </div>
    );
}
