import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
const labels: Record<string,string> = { PENDING:"در انتظار", CONFIRMED:"تأیید آزمایشی", PROCESSING:"در حال آماده‌سازی", SHIPPED:"ارسال‌شده", DELIVERED:"تحویل‌شده", CANCELLED:"لغوشده" };
const toman=(n:number)=>new Intl.NumberFormat("fa-IR").format(n)+" تومان";

export default async function AccountPage() {
 const user=await getCurrentUser();
 if(!user) return <><Header/><main className="container-wide min-h-[60vh] py-12"><section className="mx-auto max-w-xl rounded-3xl border border-[#eee9df] bg-white p-8 text-center"><h1 className="text-3xl font-bold text-forest">حساب کاربری</h1><p className="mt-4 leading-8 text-gray-600">برای مشاهده اطلاعات حساب و سفارش‌ها وارد شوید یا حساب جدید بسازید.</p><div className="mt-6 flex justify-center gap-3"><Link href="/login?next=%2Faccount" className="btn-primary">ورود</Link><Link href="/register" className="btn-outline">ثبت‌نام</Link></div></section></main><Footer/></>;

 const orders=await prisma.order.findMany({where:{userId:user.id},include:{items:true},orderBy:{createdAt:"desc"},take:20});
 return <><Header/><main className="container-wide min-h-[60vh] py-12"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm text-botanical">پنل مشتری</p><h1 className="mt-2 text-3xl font-bold text-forest">سلام، {user.name}</h1><p className="mt-2 text-gray-500">{user.email}</p></div><form action="/api/auth/logout" method="post"><button type="submit" className="btn-outline">خروج از حساب</button></form></div><section className="mt-8 rounded-3xl border border-[#eee9df] bg-white p-6"><h2 className="text-xl font-bold text-forest">سفارش‌های من</h2>{orders.length===0?<p className="mt-4 rounded-xl bg-paper p-5 leading-7 text-gray-600">هنوز سفارشی به حساب شما متصل نشده است. سفارش‌هایی که پس از ورود ثبت کنید اینجا نمایش داده می‌شوند. <Link href="/shop" className="font-semibold underline">مشاهده فروشگاه</Link></p>:<div className="mt-5 space-y-4">{orders.map(o=><article key={o.id} className="rounded-xl border border-[#eee9df] p-4"><div className="flex flex-wrap justify-between gap-2"><b>{o.orderNumber}</b><span className="text-sm text-gray-500">{new Date(o.createdAt).toLocaleDateString("fa-IR")}</span></div><div className="mt-2 flex flex-wrap justify-between gap-2 text-sm"><span>{labels[o.status]??o.status}</span><b className="text-forest">{toman(o.totalToman)}</b></div><ul className="mt-3 list-inside list-disc space-y-1 text-sm text-gray-600">{o.items.map(item=><li key={item.id}>{item.productNameSnapshot} — {new Intl.NumberFormat("fa-IR").format(item.quantity)} عدد</li>)}</ul></article>)}</div>}</section><p className="mt-5 text-xs leading-6 text-gray-500">پرداخت‌ها در این نسخه آزمایشی هستند و تراکنش بانکی واقعی انجام نمی‌شود.</p></main><Footer/></>;
}
