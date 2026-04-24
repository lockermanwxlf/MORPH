import { getBackendUrl } from "$lib/server/backend-api.js";
import { redirect } from "@sveltejs/kit";

export const load = async ({ cookies, params }) => {
    const token = cookies.get("auth_token");
    let gradeLevel = "k-5";
    if (token) {
        const data = await fetch(getBackendUrl("users/me/profile"), {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        console.log(data.ok)
        if (data.ok) {
            const profile = await data.json();
            console.log(profile.grade_level)
            gradeLevel = profile.grade_level || gradeLevel;
        }
        console.log("HI")

    }
    console.log(gradeLevel)
    redirect(302, `driving/${gradeLevel}`);
};