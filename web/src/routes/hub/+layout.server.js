// @ts-nocheck
import {
    decodeTokenEmail,
    getBackendUrl,
    parseErrorMessage,
} from "$lib/server/backend-api.js";

export async function load({ cookies, fetch }) {
    const token = cookies.get("auth_token");
    if (!token) {
        return {
            user: {
                email: null,
                gradeLevel: null,
            },
        };
    }

    const profileResponse = await fetch(getBackendUrl("/users/me/profile"), {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (profileResponse.status === 401) {
        cookies.delete("auth_token", { path: "/" });
        return {
            user: {
                email: null,
                gradeLevel: null,
            },
        };
    }

    if (profileResponse.status === 404) {
        return {
            user: {
                email: decodeTokenEmail(token),
                gradeLevel: null,
            },
        };
    }

    if (!profileResponse.ok) {
        throw new Error(await parseErrorMessage(profileResponse));
    }

    const profile = await profileResponse.json();
    return {
        user: {
            email: profile.email,
            gradeLevel: profile.grade_level,
        },
    };
}