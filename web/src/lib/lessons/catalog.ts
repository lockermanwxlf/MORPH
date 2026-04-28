export type LessonMeta = {
    slug: string;
    title: string;
    description: string;
    requiresRobot: boolean;
}

export const lessonCatalog: LessonMeta[] = [
    {
        slug: "driving",
        title: "Learning to Drive",
        description: "Learn how to drive your robot around using the controller.",
        requiresRobot: true
    }
]

const lessonsBySlug = new Map(lessonCatalog.map(lesson => [lesson.slug, lesson]));

export function getLessonMetaBySlug(slug: string): LessonMeta | undefined {
    return lessonsBySlug.get(slug.split("/")[0]);
}