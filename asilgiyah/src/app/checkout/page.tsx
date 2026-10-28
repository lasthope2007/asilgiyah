import Link from "next/link";
import { cookies } from "next/headers";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";
import { toman } from "@/lib/utils";

export const dynamic = "force-dynamic";

const errors: Record<string, string> = {
  invalid: "اطلاعات واردشده معتبر نیست. شماره موبایل، کد پستی و نشانی را بررسی کنید.",
  empty: "سبد خرید خالی است؛ ابتدا محصولی به سبد اضافه کنید.",
  stock: "موجودی یکی از محصولات کافی نیست. سبد خرید را بررسی کنید.",
  unavailable: "یکی از محصولات دیگر برای فروش فعال نیست.",
  "shipping-config": "تنظیم هزینه ارسال معتبر نیست؛ با مدیر فروشگاه تماس بگیرید.",
  failed: "ثبت سفارش انجام نشد. لطفاً دوباره تلاش کنید.",
};

export default async function Checkout({ searchParams }: { searchParams?: { error?: string } }) {
  let items: any[] = [];
  try {
    const key = cookies().get("asilgiyah_cart")?.value;
    if (key) {
      const cart = await prisma.cart.findUnique({
        where: { sessionKey: key },
        include: { items: { include: { product: true, variant: true } } },
      });
      items = cart?.items ?? [];
    }
  } catch {
    items = [];
  }

  const subtotal = items.reduce((sum, item) => sum + (item.variant?.priceToman ?? item.product.priceToman) * item.quantity, 0);
  const parsedShipping = Number.parseInt(process.env.SHIPPING_FLAT_TOMAN ?? "0", 10);
  const shipping = Number.isSafeInteger(parsedShipping) && parsedShipping >= 0 ? parsedShipping : 0;
  const error = searchParams?.error ? errors[searchParams.error] ?? errors.failed : undefined;

  return <><Header/><main className="container-wide min-h-[50vh] py-12">
    <p className="text-xs tracking-widest text-botanical">SECURE CHECKOUT · MOCK PAYMENT</p>
    <h1 className="mt-2 text-3xl font-bold text-forest">ثبت سفارش</h1>
    <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-600">این مرحله از پرداخت کاملاً آزمایشی است؛ هیچ وجهی دریافت نمی‌شود. سفارش‌ها و پرداخت‌های این نسخه با برچسب آزمایشی ذخیره می‌شوند.</p>
    {error && <div role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
    {!items.length ? <div className="mt-8 rounded-2xl border border-dashed p-10 text-center">
      <h2 className="text-xl font-bold">سبد خرید خالی است</h2>
      <p className="mt-2 text-sm text-gray-600">برای ثبت سفارش ابتدا محصولی به سبد خرید اضافه کنید.</p>
      <Link href="/shop" className="btn-primary mt-5 inline-flex">رفتن به فروشگاه</Link>
    </div> : <div className="mt-8 grid items-start gap-7 lg:grid-cols-[1fr_350px]">
      <form action="/api/checkout" method="post" className="grid gap-4 rounded-3xl border border-[#e9e4d9] p-6 sm:grid-cols-2 sm:p-8">
        <h2 className="text-xl font-bold text-forest sm:col-span-2">اطلاعات گیرنده</h2>
        {[
          { name: "name", label: "نام و نام خانوادگی", type: "text", auto: "name", pattern: undefined },
          { name: "phone", label: "شماره موبایل", type: "tel", auto: "tel", pattern: "09[0-9۰-۹]{9}" },
          { name: "email", label: "ایمیل", type: "email", auto: "email", pattern: undefined },
          { name: "province", label: "استان", type: "text", auto: "address-level1", pattern: undefined },
          { name: "city", label: "شهر", type: "text", auto: "address-level2", pattern: undefined },
          { name: "postalCode", label: "کد پستی ۱۰ رقمی", type: "text", auto: "postal-code", pattern: "[0-9۰-۹]{10}" },
        ].map((field) => <label key={field.name} className="grid gap-2 text-sm font-medium">
          {field.label}
          <input required name={field.name} type={field.type} autoComplete={field.auto} pattern={field.pattern} maxLength={field.name === "phone" ? 13 : field.name === "postalCode" ? 10 : undefined} className="w-full rounded-xl border border-[#dedbd1] bg-white px-4 py-3 outline-none focus:border-forest" />
        </label>)}
        <label className="grid gap-2 text-sm font-medium sm:col-span-2">نشانی کامل
          <textarea required name="address" minLength={10} maxLength={500} autoComplete="street-address" rows={3} className="w-full rounded-xl border border-[#dedbd1] bg-white px-4 py-3 outline-none focus:border-forest" />
        </label>
        <div className="rounded-xl bg-cream p-4 text-xs leading-6 text-gray-700 sm:col-span-2">پرداخت آزمایشی است. قبل از فروش واقعی باید هزینه و روش ارسال، درگاه پرداخت و سیاست‌های سفارش نهایی شوند.</div>
        <button className="btn-primary sm:col-span-2">ثبت سفارش آزمایشی</button>
      </form>
      <aside className="rounded-3xl bg-cream p-6">
        <h2 className="text-lg font-bold text-forest">خلاصه سفارش</h2>
        <div className="mt-4 grid gap-4">{items.map((item) => <div key={item.id} className="flex items-start justify-between gap-3 text-sm">
          <div><p className="font-medium">{item.product.name}</p><p className="mt-1 text-xs text-gray-500">{item.variant?.name ? item.variant.name + " · " : ""}تعداد: {item.quantity}</p></div>
          <span className="shrink-0">{toman((item.variant?.priceToman ?? item.product.priceToman) * item.quantity)}</span>
        </div>)}</div>
        <div className="my-5 border-t border-[#d8d1c2]" />
        <div className="flex justify-between gap-3 text-sm"><span>جمع محصولات</span><span>{toman(subtotal)}</span></div>
        <div className="mt-3 flex justify-between gap-3 text-sm"><span>ارسال</span><span>{shipping ? toman(shipping) : "۰ تومان · آزمایشی"}</span></div>
        <div className="my-5 border-t border-[#d8d1c2]" />
        <div className="flex justify-between gap-3 font-bold"><span>مبلغ نهایی</span><span>{toman(subtotal + shipping)}</span></div>
        {shipping === 0 && <p className="mt-4 text-xs leading-6 text-gray-600">هزینه ارسال فعلاً صفرِ آزمایشی است. پیش از دریافت سفارش واقعی، مقدار SHIPPING_FLAT_TOMAN را تنظیم کنید.</p>}
      </aside>
    </div>}
  </main><Footer/></>;
}
