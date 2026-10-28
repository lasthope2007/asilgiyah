import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";
import { toman } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function OrderSuccess({ searchParams }: { searchParams: { number?: string } }) {
  const number = searchParams.number?.trim() ?? "";
  if (!/^AS-[A-F0-9]{12}$/.test(number)) notFound();

  let order: any = null;
  try {
    order = await prisma.order.findUnique({
      where: { orderNumber: number },
      include: { items: true, payments: { orderBy: { createdAt: "desc" }, take: 1 } },
    });
  } catch {
    notFound();
  }
  if (!order) notFound();

  return <><Header/><main className="container-wide min-h-[55vh] py-12">
    <section className="mx-auto max-w-2xl rounded-3xl border border-[#e3e7dc] bg-white p-7 text-center shadow-sm sm:p-10">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#e7eee2] text-3xl text-forest" aria-hidden="true">✓</div>
      <p className="mt-5 text-xs tracking-widest text-botanical">MOCK ORDER CONFIRMED</p>
      <h1 className="mt-2 text-2xl font-bold text-forest">سفارش آزمایشی ثبت شد</h1>
      <p className="mt-3 text-sm leading-7 text-gray-600">این سفارش برای آزمایش فرایند فروش ثبت شده است. پرداخت شبیه‌سازی شده و هیچ مبلغی دریافت نشده؛ هنوز برای فروش واقعی آماده نیست.</p>
      <div className="mt-7 rounded-2xl bg-cream p-5 text-right">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm"><span className="text-gray-600">شماره سفارش</span><b dir="ltr">{order.orderNumber}</b></div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm"><span className="text-gray-600">وضعیت سفارش</span><b>تأیید آزمایشی</b></div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm"><span className="text-gray-600">وضعیت پرداخت</span><b>پرداخت شبیه‌سازی‌شده</b></div>
        <div className="my-4 border-t border-[#d8d1c2]" />
        <div className="grid gap-3">{order.items.map((item: any) => <div key={item.id} className="flex justify-between gap-3 text-sm"><span>{item.productNameSnapshot} × {item.quantity}</span><b className="shrink-0">{toman(item.lineTotalToman)}</b></div>)}</div>
        <div className="my-4 border-t border-[#d8d1c2]" />
        <div className="flex justify-between gap-3 font-bold"><span>مبلغ ثبت‌شده</span><span>{toman(order.totalToman)}</span></div>
      </div>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link href="/shop" className="btn-primary">بازگشت به فروشگاه</Link>
        <Link href="/" className="btn-outline">صفحه اصلی</Link>
      </div>
    </section>
  </main><Footer/></>;
}
