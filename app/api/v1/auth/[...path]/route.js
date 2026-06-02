// app/api/auth/[...path]/route.js

const BACKEND =
    process.env.BACKEND_API_URL ||
    "https://nextauth-my1u.onrender.com/api/v1/auth";

async function handler(request, { params }) {
    const path = params.path.join("/");
    const token = request.headers.get("Authorization");

    const headers = { "Content-Type": "application/json" };
    // Fix: only attach Authorization if a real token is present
    if (token) headers["Authorization"] = token;

    const options = { method: request.method, headers };

    if (request.method !== "GET") {
        options.body = await request.text();
    }

    try {
        const res = await fetch(`${BACKEND}/${path}`, options);

        // Fix: gracefully handle non-JSON responses (e.g. Render HTML error pages)
        const data = await res
            .json()
            .catch(() => ({ detail: "Backend returned a non-JSON response" }));

        return Response.json(data, { status: res.status });
    } catch (err) {
        return Response.json(
            { detail: "Proxy error: " + err.message },
            { status: 502 }
        );
    }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;