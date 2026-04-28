// @ts-nocheck
import { fail, redirect } from "@sveltejs/kit";

import { loginWithEmailPassword } from "$lib/server/backend-api.js";

export async function load({ cookies }) {
    if (cookies.get("auth_token")) {
        redirect(303, "/hub/home");
    }
}

export const actions = {
    default: async ({ request, cookies, fetch }) => {
        const formData = await request.formData();
        const email = String(formData.get("email") ?? "").trim();
        const password = String(formData.get("password") ?? "");

        if (!email || !password) {
            return fail(400, {
                error: "Email and password are required",
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
            return fail(401, {
                error: error instanceof Error ? error.message : "Unable to sign in",
                email,
            });
        }

        redirect(303, "/hub/home");
    },
};