export type LessonDifficulty = "beginner" | "intermediate" | "advanced";

export type LessonDefinition = {
    slug: string;
    title: string;
    description: string;
    published: boolean;
    requiresRobot: boolean;
    difficulty: LessonDifficulty;
    order: number;
    componentPath: string;
};

export type LessonMeta = Omit<LessonDefinition, "componentPath">;

export const lessonCatalog: LessonDefinition[] = [
    {
        slug: "1",
        title: "Lesson 1: Learning to Drive",
        description:
            "Use WASD controls, understand differential drive, and interpret Twist movement commands.",
        published: true,
        requiresRobot: true,
        difficulty: "beginner",
        order: 1,
        componentPath: "./1.svelte",
    },
];

function sortByOrder(a: LessonDefinition, b: LessonDefinition) {
    return a.order - b.order;
}

function stripComponentPath(lesson: LessonDefinition): LessonMeta {
    const { componentPath: _componentPath, ...meta } = lesson;
    return meta;
}

export function getPublishedLessons(): LessonMeta[] {
    return lessonCatalog
        .filter((lesson) => lesson.published)
        .sort(sortByOrder)
        .map(stripComponentPath);
}

export function getPublishedLessonCount(): number {
    return lessonCatalog.filter((lesson) => lesson.published).length;
}

export function getLessonMetaBySlug(
    slug: string,
    { includeUnpublished = false }: { includeUnpublished?: boolean } = {},
): LessonMeta | null {
    const lesson = lessonCatalog.find((candidate) => candidate.slug === slug);
    if (!lesson) {
        return null;
    }

    if (!includeUnpublished && !lesson.published) {
        return null;
    }

    return stripComponentPath(lesson);
}

export function getLessonDefinitionBySlug(
    slug: string,
    { includeUnpublished = false }: { includeUnpublished?: boolean } = {},
): LessonDefinition | null {
    const lesson = lessonCatalog.find((candidate) => candidate.slug === slug);
    if (!lesson) {
        return null;
    }

    if (!includeUnpublished && !lesson.published) {
        return null;
    }

    return lesson;
}