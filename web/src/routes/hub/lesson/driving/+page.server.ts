import { getBackendUrl } from "$lib/server/backend-api.js";
import { redirect } from "@sveltejs/kit";

export const load = async ({ cookies, params }) => {
    const token = cookies.get("auth_token");
    let gradeLevel = "k-5";
    if (token) {
        const data = await fetch(getBackendUrl("me/profile"), {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        if (data.ok) {
            const profile = await data.json();
            gradeLevel = profile.gradeLevel || gradeLevel;
        }
    }
    redirect(302, `driving/${gradeLevel}`);
};