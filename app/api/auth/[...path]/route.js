// app/api/auth/[...path]/route.js

const BACKEND = "https://web-production-b426.up.railway.app/api/v1/auth";

async function handler(request, { params }) {
    const path = params.path.join("/");
    const token = request.headers.get("Authorization");

    const options = {
        method: request.method,
        headers: {
            "Content-Type": "application/json",
            "Authorization": token || "",
        },
    };

    if (request.method !== "GET") {
        options.body = await request.text();
    }

    try {
        const res = await fetch(`${BACKEND}/${path}`, options);
        const data = await res.json();
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