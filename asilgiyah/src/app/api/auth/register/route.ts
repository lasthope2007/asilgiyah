import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createUserSession } from "@/lib/session";
export const runtime = "nodejs";
const schema = z.object({ name: z.string().trim().min(2).max(80), email: z.string().trim().email().max(254), password: z.string().min(8).max(72) });
export async function POST(request: NextRequest) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "اطلاعات ارسالی معتبر نیست." }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "نام، ایمیل معتبر و رمز عبور حداقل ۸ کاراکتری وارد کنید." }, { status: 400 });
  const email = parsed.data.email.toLowerCase();
  try {
    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) return NextResponse.json({ error: "با این ایمیل قبلاً حساب ساخته شده است." }, { status: 409 });
    const user = await prisma.user.create({ data: { name: parsed.data.name, email, passwordHash: await hash(parsed.data.password, 12) }, select: { id: true, name: true, email: true } });
    await createUserSession(user.id);
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") return NextResponse.json({ error: "با این ایمیل قبلاً حساب ساخته شده است." }, { status: 409 });
    console.error("Registration failed", error);
    return NextResponse.json({ error: "ساخت حساب فعلاً ممکن نیست؛ دوباره تلاش کنید." }, { status: 500 });
  }
}
