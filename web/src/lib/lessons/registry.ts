import { getLessonDefinitionBySlug, type LessonDefinition } from "$lib/lessons/catalog.js";

const lessonModules = import.meta.glob("./*.svelte");

export type LoadedLesson = {
    lesson: LessonDefinition;
    component: unknown;
};

export async function loadLessonComponentBySlug(
    slug: string,
    options: { includeUnpublished?: boolean } = {},
): Promise<LoadedLesson | null> {
    const lesson = getLessonDefinitionBySlug(slug, options);
    if (!lesson) {
        return null;
    }

    const loader = lessonModules[lesson.componentPath];
    if (!loader) {
        throw new Error(`No lesson module found for slug ${slug}`);
    }

    const module = await loader();

    return {
        lesson,
        component: module.default,
    };
}