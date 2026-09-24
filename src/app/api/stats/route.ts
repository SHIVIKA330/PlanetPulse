import { NextResponse } from 'next/server';
import { getStats, getDashboardData } from '@/lib/store';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * GET /api/stats
 * Query param: ?dashboard=true to get full dashboard data including recent activities.
 * Otherwise returns just the stats summary.
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const dashboard = url.searchParams.get('dashboard');

    if (dashboard === 'true') {
      const data = getDashboardData();
      return NextResponse.json(data, { status: 200, headers: CORS_HEADERS });
    }

    const stats = getStats();
    return NextResponse.json(stats, { status: 200, headers: CORS_HEADERS });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}
