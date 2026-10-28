import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getCurrentUser } from "@/lib/session";
export const dynamic = "force-dynamic";
export default async function AccountPage(){
 const user=await getCurrentUser();
 return <><Header/><main className="container-wide min-h-[60vh] py-12"><section className="mx-auto max-w-2xl rounded-3xl border border-[#eee9df] bg-white p-7"><h1 className="text-3xl font-bold text-forest">حساب کاربری</h1>{!user?<><p className="mt-4 leading-8 text-gray-600">برای دسترسی به حساب کاربری ابتدا وارد شوید یا حساب جدید بسازید.</p><div className="mt-6 flex gap-3"><Link href="/login" className="btn-primary">ورود</Link><Link href="/register" className="btn-outline">ثبت‌نام</Link></div></>:<><p className="mt-4 leading-8 text-gray-600">سلام، {user.name}</p><p className="text-gray-500">{user.email}</p><form action="/api/auth/logout" method="post" className="mt-6"><button type="submit" className="btn-outline">خروج از حساب</button></form><p className="mt-5 text-sm text-gray-500">بخش سفارش‌ها در مرحلهٔ بعد به حساب متصل خواهد شد.</p></>}</section></main><Footer/></>;
}