import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import { checkoutSchema } from "@/lib/checkout-validation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export const runtime = "nodejs";

function checkoutError(request: NextRequest, code: string) {
  return NextResponse.redirect(new URL(`/checkout?error=${encodeURIComponent(code)}`, request.url), 303);
}

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const parsed = checkoutSchema.safeParse({
    name: form.get("name"),
    phone: form.get("phone"),
    email: form.get("email"),
    province: form.get("province"),
    city: form.get("city"),
    postalCode: form.get("postalCode"),
    address: form.get("address"),
  });
  if (!parsed.success) return checkoutError(request, "invalid");

  const cartKey = cookies().get("asilgiyah_cart")?.value;
  if (!cartKey) return checkoutError(request, "empty");

  const configuredShipping = Number.parseInt(process.env.SHIPPING_FLAT_TOMAN ?? "0", 10);
  if (!Number.isSafeInteger(configuredShipping) || configuredShipping < 0) {
    return checkoutError(request, "shipping-config");
  }

  try {
    const currentUser = await getCurrentUser();
    const order = await prisma.$transaction(async (tx) => {
      const cart = await tx.cart.findUnique({
        where: { sessionKey: cartKey },
        include: { items: { include: { product: true, variant: true } } },
      });
      if (!cart || cart.items.length === 0) throw new Error("EMPTY_CART");

      const lines = cart.items.map((item) => {
        if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 20) {
          throw new Error("INVALID_QUANTITY");
        }
        if (!item.product.isActive) throw new Error("UNAVAILABLE_PRODUCT");
        return {
          item,
          unitPrice: item.variant?.priceToman ?? item.product.priceToman,
          lineTotal: (item.variant?.priceToman ?? item.product.priceToman) * item.quantity,
        };
      });
      const subtotalToman = lines.reduce((sum, line) => sum + line.lineTotal, 0);
      if (!Number.isSafeInteger(subtotalToman) || subtotalToman <= 0) throw new Error("INVALID_TOTAL");
      const shippingToman = configuredShipping;
      const totalToman = subtotalToman + shippingToman;
      if (!Number.isSafeInteger(totalToman)) throw new Error("INVALID_TOTAL");

      const orderNumber = `AS-${randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`;

      for (const { item } of lines) {
        // Variant stock is authoritative when a specific variant is selected.
        // Decrementing both product and variant stock double-counts the same units.
        if (item.variantId) {
          const variantUpdate = await tx.productVariant.updateMany({
            where: { id: item.variantId, productId: item.productId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (variantUpdate.count !== 1) throw new Error("OUT_OF_STOCK");
        } else {
          const productUpdate = await tx.product.updateMany({
            where: { id: item.productId, isActive: true, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (productUpdate.count !== 1) throw new Error("OUT_OF_STOCK");
        }
      }

      const created = await tx.order.create({
        data: {
          orderNumber,
          userId: currentUser?.id ?? null,
          customerName: parsed.data.name,
          email: parsed.data.email,
          phone: parsed.data.phone,
          province: parsed.data.province,
          city: parsed.data.city,
          addressLine: parsed.data.address,
          postalCode: parsed.data.postalCode,
          subtotalToman,
          shippingToman,
          totalToman,
          currency: "TOMAN",
          status: "CONFIRMED",
          isDemo: true,
          items: {
            create: lines.map(({ item, unitPrice, lineTotal }) => ({
              productId: item.productId,
              variantId: item.variantId,
              productNameSnapshot: item.product.name,
              variantNameSnapshot: item.variant?.name ?? null,
              skuSnapshot: item.variant?.sku ?? item.product.sku,
              unitPriceToman: unitPrice,
              quantity: item.quantity,
              lineTotalToman: lineTotal,
            })),
          },
          payments: {
            create: {
              provider: "MOCK",
              amountToman: totalToman,
              status: "SUCCEEDED",
              isSimulated: true,
            },
          },
        },
      });

      for (const { item } of lines) {
        await tx.inventoryTransaction.create({
          data: {
            productId: item.productId,
            variantId: item.variantId,
            delta: -item.quantity,
            reason: "MOCK_ORDER_CONFIRMED",
            reference: orderNumber,
          },
        });
      }
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      return created;
    });

    return NextResponse.redirect(
      new URL(`/order/success?number=${encodeURIComponent(order.orderNumber)}`, request.url),
      303,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "EMPTY_CART") return checkoutError(request, "empty");
    if (message === "OUT_OF_STOCK") return checkoutError(request, "stock");
    if (message === "UNAVAILABLE_PRODUCT") return checkoutError(request, "unavailable");
    if (message === "INVALID_QUANTITY" || message === "INVALID_TOTAL") return checkoutError(request, "invalid");
    console.error("Checkout failed", error);
    return checkoutError(request, "failed");
  }
}
