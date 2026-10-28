import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createUserSession } from "@/lib/session";
export const runtime = "nodejs";
const schema = z.object({ email: z.string().trim().email().max(254), password: z.string().min(1).max(72) });
export async function POST(request: NextRequest) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "اطلاعات ورود معتبر نیست." }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "ایمیل و رمز عبور را درست وارد کنید." }, { status: 400 });
  try {
    const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
    const valid = user ? await compare(parsed.data.password, user.passwordHash) : false;
    if (!user || !valid) return NextResponse.json({ error: "ایمیل یا رمز عبور اشتباه است." }, { status: 401 });
    await createUserSession(user.id);
    return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    console.error("Login failed", error);
    return NextResponse.json({ error: "ورود فعلاً ممکن نیست؛ دوباره تلاش کنید." }, { status: 500 });
  }
}
