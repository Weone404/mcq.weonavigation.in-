export async function POST(request, { params }) {
    const path = params.path.join('/');
    const body = await request.text();

    const res = await fetch(
        `https://nextauth-my1u.onrender.com/api/v1/auth/${path}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body,
        }
    );

    const data = await res.json();
    return Response.json(data, { status: res.status });
}