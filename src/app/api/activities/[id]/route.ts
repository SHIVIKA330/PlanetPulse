import { NextRequest, NextResponse } from 'next/server';
import { getActivityById, deleteActivity } from '@/lib/store';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * GET /api/activities/[id]
 * Returns a single activity by ID.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const activity = getActivityById(id);

    if (!activity) {
      return NextResponse.json(
        { error: `Activity not found: "${id}"` },
        { status: 404, headers: CORS_HEADERS },
      );
    }

    return NextResponse.json(
      { activity },
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
 * DELETE /api/activities/[id]
 * Deletes an activity by ID.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const deleted = deleteActivity(id);

    if (!deleted) {
      return NextResponse.json(
        { error: `Activity not found: "${id}"` },
        { status: 404, headers: CORS_HEADERS },
      );
    }

    return NextResponse.json(
      { message: 'Activity deleted successfully.', id },
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
