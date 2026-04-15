// @ts-nocheck
import { getBackendUrl } from "$lib/server/backend-api.js";
import { getPublishedLessonCount } from "$lib/lessons/catalog.js";

const TOTAL_LESSONS = getPublishedLessonCount();

export async function load({ cookies, fetch }) {
    const token = cookies.get("auth_token");

    if (!token) {
        return {
            lessons: {
                completedCount: 0,
                totalCount: TOTAL_LESSONS,
            },
        };
    }

    const response = await fetch(getBackendUrl("/progress/me/lessons/completed"), {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        return {
            lessons: {
                completedCount: 0,
                totalCount: TOTAL_LESSONS,
            },
        };
    }

    const data = await response.json();
    const completedCount = Array.isArray(data.lesson_ids) ? data.lesson_ids.length : 0;

    return {
        lessons: {
            completedCount,
            totalCount: TOTAL_LESSONS,
        },
    };
}
