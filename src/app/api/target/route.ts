import { NextRequest, NextResponse } from 'next/server';
import { getWeeklyTarget, setWeeklyTarget } from '@/lib/store';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * GET /api/target
 * Returns the current weekly CO2 target.
 */
export async function GET() {
  try {
    const target = getWeeklyTarget();
    return NextResponse.json(
      { target },
      { status: 200, headers: CORS_HEADERS },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

/**
 * PUT /api/target
 * Body: { target_kg: number }
 * Sets a new weekly CO2 target.
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    const { target_kg } = body;

    if (target_kg === undefined || target_kg === null) {
      return NextResponse.json(
        { error: 'Missing required field: "target_kg".' },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    const value = Number(target_kg);
    if (!isFinite(value) || value <= 0) {
      return NextResponse.json(
        { error: 'target_kg must be a positive number.' },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    const target = setWeeklyTarget(value);

    return NextResponse.json(
      { target },
      { status: 200, headers: CORS_HEADERS },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: 400, headers: CORS_HEADERS },
    );
  }
}
