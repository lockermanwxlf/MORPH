import { error } from "@sveltejs/kit";
import { getLessonMetaBySlug } from "$lib/lessons/catalog.js";

export function load({ params }) {
    const lesson = getLessonMetaBySlug(params.slug);

    if (!lesson) {
        throw error(404, "Lesson not found");
    }

    return {
        slug: lesson.slug,
        lesson,
    };
}