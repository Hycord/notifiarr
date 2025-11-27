import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://localhost:3001';
const AUTH_TOKEN = process.env.NEXT_PUBLIC_API_TOKEN || '';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> }
) {
  const params = await context.params;
  return proxyRequest(request, params);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> }
) {
  const params = await context.params;
  return proxyRequest(request, params);
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> }
) {
  const params = await context.params;
  return proxyRequest(request, params);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> }
) {
  const params = await context.params;
  return proxyRequest(request, params);
}

async function proxyRequest(
  request: NextRequest,
  params: { path?: string[] }
) {
  const url = new URL(request.url);
  const pathSegments = params.path || [];
  const apiPath = pathSegments.length > 0 ? `/${pathSegments.join('/')}` : '';
  const backendUrl = `${BACKEND_URL}/api${apiPath}${url.search}`;

  console.log('[Proxy] Request:', {
    method: request.method,
    path: pathSegments,
    apiPath,
    backendUrl,
  });

  try {
    const headers: HeadersInit = {
      'Authorization': `Bearer ${AUTH_TOKEN}`,
    };

    // Copy content-type from original request
    const contentType = request.headers.get('content-type');
    if (contentType) {
      headers['Content-Type'] = contentType;
    }

    const options: RequestInit = {
      method: request.method,
      headers,
    };

    // Include body for POST, PUT, DELETE
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
      // Check if this is a binary upload (gzip, octet-stream) or text
      const contentType = request.headers.get('content-type') || '';
      if (contentType.includes('gzip') || contentType.includes('octet-stream')) {
        // Handle binary data
        const blob = await request.blob();
        if (blob.size > 0) {
          options.body = blob;
        }
      } else {
        // Handle text/json data
        const body = await request.text();
        if (body) {
          options.body = body;
        }
      }
    }

    const response = await fetch(backendUrl, options);
    
    // Log response details
    console.log('[Proxy]', {
      method: request.method,
      path: apiPath,
      status: response.status,
      contentType: response.headers.get('content-type'),
    });
    
    // Handle different content types
    const responseContentType = response.headers.get('content-type');
    
    // For successful responses, check content type
    if (response.ok) {
      if (responseContentType?.includes('application/json')) {
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
      } else if (responseContentType?.includes('application/gzip') || responseContentType?.includes('application/octet-stream')) {
        // Handle binary responses (like config exports)
        const blob = await response.blob();
        console.log('[Proxy] Returning binary response, size:', blob.size);
        return new NextResponse(blob, {
          status: response.status,
          headers: { 
            'Content-Type': responseContentType || 'application/octet-stream',
            'Content-Disposition': response.headers.get('content-disposition') || 'attachment',
          },
        });
      } else {
        // Return text/plain responses as-is
        const text = await response.text();
        console.log('[Proxy] Returning text response, length:', text.length);
        return new NextResponse(text, {
          status: response.status,
          headers: { 'Content-Type': responseContentType || 'text/plain' },
        });
      }
    }
    
    // For error responses, try to parse as JSON first
    const text = await response.text();
    console.error('[Proxy] Error response:', text.substring(0, 200));
    return new NextResponse(text, {
      status: response.status,
      headers: { 'Content-Type': responseContentType || 'text/plain' },
    });
  } catch (error) {
    console.error('[Proxy] Exception:', error);
    return NextResponse.json(
      { error: 'Failed to proxy request to backend', details: String(error) },
      { status: 500 }
    );
  }
}
