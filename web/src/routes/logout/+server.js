// @ts-nocheck
import { redirect } from "@sveltejs/kit";

export async function POST({ cookies, request, url }) {
    cookies.delete("auth_token", { path: "/" });

    const referer = request.headers.get("referer");
    let destination = "/";

    if (referer) {
        try {
            const refererUrl = new URL(referer);
            if (refererUrl.origin === url.origin) {
                destination = `${refererUrl.pathname}${refererUrl.search}${refererUrl.hash}`;
            }
        } catch {
            // no-op, keep default destination
        }
    }

    redirect(303, destination);
}
