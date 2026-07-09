import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const errorType = searchParams.get("error");

  return NextResponse.json({
    status: "NextAuth Configuration Debugger",
    errorCode: errorType,
    hint: "If you see 'Configuration', check that your authConfig object doesn't contain database adapters or methods incompatible with NextAuth v4.",
  });
}