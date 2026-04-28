// @ts-nocheck
import { fail, redirect } from "@sveltejs/kit";

import {
    getBackendUrl,
    loginWithEmailPassword,
    parseErrorMessage,
} from "$lib/server/backend-api.js";

export async function load({ cookies }) {
    if (cookies.get("auth_token")) {
        redirect(303, "/hub/home");
    }
}

export const actions = {
    default: async ({ request, fetch, cookies }) => {
        const formData = await request.formData();
        const email = String(formData.get("email") ?? "").trim();
        const password = String(formData.get("password") ?? "");
        const confirmPassword = String(formData.get("confirmPassword") ?? "");

        if (!email || !password || !confirmPassword) {
            return fail(400, {
                error: "Email, password, and confirmation are required",
                email,
            });
        }

        if (password !== confirmPassword) {
            return fail(400, {
                error: "Passwords do not match",
                email,
            });
        }

        const registerResponse = await fetch(getBackendUrl("/auth/register"), {
            method: "POST",
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify({ email, password }),
        });

        if (!registerResponse.ok) {
            return fail(400, {
                error: await parseErrorMessage(registerResponse),
                email,
            });
        }

        try {
            const tokenData = await loginWithEmailPassword(fetch, email, password);
            cookies.set("auth_token", tokenData.access_token, {
                httpOnly: true,
                path: "/",
                sameSite: "lax",
                secure: process.env.NODE_ENV === "production",
            });
        } catch (error) {
            return fail(400, {
                error: error instanceof Error ? error.message : "Registered, but sign in failed",
                email,
            });
        }

        redirect(303, "/hub/profile");
    },
};