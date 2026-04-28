// @ts-nocheck
import { fail } from "@sveltejs/kit";

import { getBackendUrl, parseErrorMessage } from "$lib/server/backend-api.js";

const gradeLevels = ["k-5", "6-12", "uni"];

export const actions = {
    default: async ({ request, cookies, fetch }) => {
        const token = cookies.get("auth_token");
        if (!token) {
            return fail(401, {
                error: "You are not signed in",
            });
        }

        const formData = await request.formData();
        const gradeLevel = String(formData.get("gradeLevel") ?? "");

        if (!gradeLevels.includes(gradeLevel)) {
            return fail(400, {
                error: "Please choose a valid grade level",
                gradeLevel,
            });
        }

        const response = await fetch(getBackendUrl("/users/me/profile"), {
            method: "PUT",
            headers: {
                "content-type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ grade_level: gradeLevel }),
        });

        if (response.status === 401) {
            cookies.delete("auth_token", { path: "/" });
            return fail(401, {
                error: "You are not signed in",
                gradeLevel,
            });
        }

        if (!response.ok) {
            return fail(response.status, {
                error: await parseErrorMessage(response),
                gradeLevel,
            });
        }

        return {
            success: true,
            gradeLevel,
        };
    },
};