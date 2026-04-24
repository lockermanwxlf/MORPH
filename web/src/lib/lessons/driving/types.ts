export type LessonSection = {
    title?: string;
    paragraphs?: string[];
    bullets?: string[];
};

export type LessonNavLink = {
    href: string;
    label: string;
    variant?: "primary" | "secondary";
};

export type LessonTaskContent = {
    badge?: string;
    title: string;
    description?: string;
    sections?: LessonSection[];
    leftNav?: LessonNavLink;
    rightNav?: LessonNavLink;
};
