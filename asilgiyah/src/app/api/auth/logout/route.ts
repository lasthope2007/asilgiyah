import { NextRequest, NextResponse } from "next/server";
import { destroyCurrentSession } from "@/lib/session";
export async function POST(request: NextRequest) {
  await destroyCurrentSession();
  return NextResponse.redirect(new URL("/login", request.url), 303);
}
