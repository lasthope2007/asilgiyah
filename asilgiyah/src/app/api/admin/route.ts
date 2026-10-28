import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export const runtime = "nodejs";

async function requireAdmin() {
  const user = await getCurrentUser();
  return user?.role === "ADMIN" ? user : null;
}

const productSchema = z.object({
  name: z.string().trim().min(2).max(160),
  slug: z.string().trim().min(2).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().min(5).max(8000),
  shortDescription: z.string().trim().min(3).max(300),
  sku: z.string().trim().min(2).max(80).regex(/^[A-Za-z0-9_-]+$/),
  priceToman: z.number().int().min(0).max(2_000_000_000),
  stock: z.number().int().min(0).max(1_000_000),
  categoryId: z.string().min(1),
  imageUrl: z.string().trim().url().max(2000).optional().or(z.literal("")),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

const statusSchema = z.enum(["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"]);

export async function POST(request: NextRequest) {
  const actor = await requireAdmin();
  if (!actor) return NextResponse.json({ error: "دسترسی مدیریت لازم است." }, { status: 403 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "درخواست نامعتبر است." }, { status: 400 }); }
  const input = body as Record<string, unknown>;
  const action = input?.action;

  try {
    if (action === "product.create" || action === "product.update") {
      const parsed = productSchema.safeParse({
        ...input,
        priceToman: Number(input.priceToman),
        stock: Number(input.stock),
      });
      if (!parsed.success) return NextResponse.json({ error: "اطلاعات محصول کامل یا معتبر نیست." }, { status: 400 });
      const data = parsed.data;
      const category = await prisma.category.findUnique({ where: { id: data.categoryId }, select: { id: true } });
      if (!category) return NextResponse.json({ error: "دسته‌بندی انتخاب‌شده وجود ندارد." }, { status: 400 });

      const productId = typeof input.productId === "string" ? input.productId : "";
      if (action === "product.update" && !productId) return NextResponse.json({ error: "شناسه محصول لازم است." }, { status: 400 });
      const productData = {
        name: data.name,
        slug: data.slug,
        description: data.description,
        shortDescription: data.shortDescription,
        sku: data.sku,
        priceToman: data.priceToman,
        stock: data.stock,
        categoryId: data.categoryId,
        isActive: data.isActive ?? true,
        isFeatured: data.isFeatured ?? false,
      };

      const product = await prisma.$transaction(async (tx) => {
        const saved = action === "product.create"
          ? await tx.product.create({ data: { ...productData, ingredients: [], isDemo: false } })
          : await tx.product.update({ where: { id: productId }, data: productData });
        if (data.imageUrl) {
          await tx.productImage.deleteMany({ where: { productId: saved.id } });
          await tx.productImage.create({ data: { productId: saved.id, url: data.imageUrl, alt: data.name, sortOrder: 0 } });
        }
        await tx.auditLog.create({ data: { actorId: actor.id, action, entityType: "Product", entityId: saved.id, metadata: { name: saved.name, sku: saved.sku } } });
        return saved;
      });
      return NextResponse.json({ ok: true, message: action === "product.create" ? "محصول ایجاد شد." : "محصول ذخیره شد.", productId: product.id });
    }

    if (action === "product.toggle") {
      const productId = typeof input.productId === "string" ? input.productId : "";
      if (!productId) return NextResponse.json({ error: "شناسه محصول لازم است." }, { status: 400 });
      const existing = await prisma.product.findUnique({ where: { id: productId }, select: { id: true, isActive: true, name: true } });
      if (!existing) return NextResponse.json({ error: "محصول پیدا نشد." }, { status: 404 });
      await prisma.$transaction([
        prisma.product.update({ where: { id: productId }, data: { isActive: !existing.isActive } }),
        prisma.auditLog.create({ data: { actorId: actor.id, action: "product.toggle", entityType: "Product", entityId: productId, metadata: { active: !existing.isActive } } }),
      ]);
      return NextResponse.json({ ok: true, message: existing.isActive ? "محصول غیرفعال شد." : "محصول فعال شد." });
    }

    if (action === "order.status") {
      const orderId = typeof input.orderId === "string" ? input.orderId : "";
      const parsedStatus = statusSchema.safeParse(input.status);
      if (!orderId || !parsedStatus.success) return NextResponse.json({ error: "وضعیت سفارش نامعتبر است." }, { status: 400 });
      const order = await prisma.order.findUnique({ where: { id: orderId }, select: { id: true, orderNumber: true, status: true } });
      if (!order) return NextResponse.json({ error: "سفارش پیدا نشد." }, { status: 404 });
      await prisma.$transaction([
        prisma.order.update({ where: { id: orderId }, data: { status: parsedStatus.data } }),
        prisma.auditLog.create({ data: { actorId: actor.id, action: "order.status", entityType: "Order", entityId: orderId, metadata: { from: order.status, to: parsedStatus.data, orderNumber: order.orderNumber } } }),
      ]);
      return NextResponse.json({ ok: true, message: "وضعیت سفارش به‌روزرسانی شد." });
    }

    return NextResponse.json({ error: "عملیات پشتیبانی نمی‌شود." }, { status: 400 });
  } catch (error) {
    const code = (error as { code?: string })?.code;
    if (code === "P2002") return NextResponse.json({ error: "شناسه یکتا، نام کاربری یا SKU تکراری است." }, { status: 409 });
    if (code === "P2025") return NextResponse.json({ error: "رکورد موردنظر پیدا نشد." }, { status: 404 });
    console.error("Admin operation failed", error);
    return NextResponse.json({ error: "عملیات انجام نشد. تنظیمات پایگاه داده را بررسی کنید." }, { status: 500 });
  }
}
