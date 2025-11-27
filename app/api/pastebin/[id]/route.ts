import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  if (!id || !/^[A-Za-z0-9]+$/.test(id)) {
    return NextResponse.json({ error: 'Invalid Pastebin ID' }, { status: 400 });
  }
  const url = `https://pastebin.com/raw/${id}`;
  try {
    const res = await fetch(url, { headers: { 'Accept': 'text/plain' } });
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: `Fetch failed: ${res.status} ${text}` }, { status: 502 });
    }
    const body = await res.text();
    // Return as plain text so client can treat it as base64
    return new NextResponse(body, {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Proxy error' }, { status: 500 });
  }
}