import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const urlParam = req.nextUrl.searchParams.get('url')
  if (!urlParam) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 })
  }

  let target: URL
  try {
    target = new URL(urlParam)
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  if (target.protocol !== 'http:' && target.protocol !== 'https:') {
    return NextResponse.json({ error: 'Only http/https URLs are allowed' }, { status: 400 })
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    const res = await fetch(target.toString(), {
      headers: { Accept: 'text/plain,*/*;q=0.8' },
      cache: 'no-store',
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      return NextResponse.json(
        { error: `Upstream fetch failed: ${res.status} ${text?.slice(0, 200)}` },
        { status: 502 }
      )
    }

    const body = await res.text()
    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    })
  } catch (e: any) {
    const message = e?.name === 'AbortError' ? 'Request timed out' : e?.message || 'Proxy error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
