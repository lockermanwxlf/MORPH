import { env } from "$env/dynamic/private";

const DEFAULT_BACKEND_URL = "http://127.0.0.1:8000";

export type GradeLevel = "k-5" | "6-12" | "uni";

export type UserProfile = {
    email: string;
    grade_level: GradeLevel;
};

export function getBackendUrl(path: string): string {
    const baseUrl = (env.BACKEND_URL ?? DEFAULT_BACKEND_URL).replace(/\/$/, "");
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${baseUrl}${cleanPath}`;
}

export async function parseErrorMessage(response: Response): Promise<string> {
    const fallback = `Request failed with status ${response.status}`;
    try {
        const data = (await response.json()) as {
            detail?: string | { msg?: string }[];
        };

        if (typeof data.detail === "string") {
            return data.detail;
        }

        if (Array.isArray(data.detail)) {
            const messages = data.detail
                .map((item) => item.msg)
                .filter((msg): msg is string => Boolean(msg));
            if (messages.length > 0) {
                return messages.join(", ");
            }
        }

        return fallback;
    } catch {
        return fallback;
    }
}

export function decodeTokenEmail(token: string): string | null {
    const tokenParts = token.split(".");
    if (tokenParts.length < 2) {
        return null;
    }

    try {
        const base64 = tokenParts[1].replace(/-/g, "+").replace(/_/g, "/");
        const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
        const payloadJson = atob(padded);
        const payload = JSON.parse(payloadJson) as { sub?: unknown };
        return typeof payload.sub === "string" ? payload.sub : null;
    } catch {
        return null;
    }
}

export async function loginWithEmailPassword(
    fetchFn: typeof fetch,
    email: string,
    password: string,
): Promise<{ access_token: string; token_type: string }> {
    const body = new URLSearchParams({
        username: email,
        password,
    });

    const response = await fetchFn(getBackendUrl("/auth/token"), {
        method: "POST",
        headers: {
            "content-type": "application/x-www-form-urlencoded",
        },
        body,
    });

    if (!response.ok) {
        throw new Error(await parseErrorMessage(response));
    }

    return (await response.json()) as { access_token: string; token_type: string };
}
