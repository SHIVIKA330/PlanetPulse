import { NextRequest, NextResponse } from "next/server";
import { generateEcoResponse } from "@/lib/ecoIntelligence";
import { getStats } from "@/lib/store";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, stats: customStats } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message string is required." },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Get live stats from store if not supplied
    const currentStats = customStats || getStats();

    // Generate intelligent AI response
    const responseData = generateEcoResponse(message, currentStats);

    return NextResponse.json(responseData, {
      status: 200,
      headers: CORS_HEADERS,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to process AI assistant request.";
    return NextResponse.json(
      { error: message },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
