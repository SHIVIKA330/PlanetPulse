import { NextRequest, NextResponse } from 'next/server';
import {
  addActivity,
  getActivities,
  EMISSION_FACTORS,
  type Activity,
  type ActivityFilters,
} from '@/lib/store';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * GET /api/activities
 * Query params: type, start_date, end_date
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const filters: ActivityFilters = {};

    const typeParam = searchParams.get('type');
    if (typeParam) {
      const normalizedType = typeParam.toLowerCase().replace(/-/g, '_');
      if (normalizedType !== 'all' && !EMISSION_FACTORS[normalizedType as Activity['type']]) {
        return NextResponse.json(
          { error: `Invalid activity type: "${typeParam}". Must be one of: ${Object.keys(EMISSION_FACTORS).join(', ')}` },
          { status: 400, headers: CORS_HEADERS },
        );
      }
      filters.type = normalizedType as Activity['type'];
    }

    const startDate = searchParams.get('start_date');
    if (startDate) {
      if (isNaN(Date.parse(startDate))) {
        return NextResponse.json(
          { error: 'Invalid start_date. Must be a valid ISO date string.' },
          { status: 400, headers: CORS_HEADERS },
        );
      }
      filters.start_date = startDate;
    }

    const endDate = searchParams.get('end_date');
    if (endDate) {
      if (isNaN(Date.parse(endDate))) {
        return NextResponse.json(
          { error: 'Invalid end_date. Must be a valid ISO date string.' },
          { status: 400, headers: CORS_HEADERS },
        );
      }
      filters.end_date = endDate;
    }

    const activities = getActivities(filters);

    return NextResponse.json(
      { activities, count: activities.length },
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
 * POST /api/activities
 * Body: { type: string, quantity: number }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { type, quantity } = body;

    if (!type || quantity === undefined || quantity === null) {
      return NextResponse.json(
        { error: 'Missing required fields: "type" and "quantity".' },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    if (!EMISSION_FACTORS[type as Activity['type']]) {
      return NextResponse.json(
        { error: `Invalid activity type: "${type}". Must be one of: ${Object.keys(EMISSION_FACTORS).join(', ')}` },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    const qty = Number(quantity);
    if (!isFinite(qty) || qty <= 0) {
      return NextResponse.json(
        { error: 'Quantity must be a positive number.' },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    const activity = addActivity(type as Activity['type'], qty);

    return NextResponse.json(
      { activity },
      { status: 201, headers: CORS_HEADERS },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: 400, headers: CORS_HEADERS },
    );
  }
}
