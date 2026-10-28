"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BarChart3, Leaf, Package, ShoppingBag, Users, ArrowUpLeft, RefreshCw, Plus, ExternalLink, ShieldCheck } from "lucide-react";

type Product = { id: string; name: string; slug: string; description: string; shortDescription: string; sku: string; priceToman: number; stock: number; isActive: boolean; isFeatured: boolean; categoryId: string; category: { name: string }; images: { url: string }[] };
type Order = { id: string; orderNumber: string; customerName: string; email: string; totalToman: number; status: string; createdAt: string; items: { id: string; productNameSnapshot: string; quantity: number }[] };
type Category = { id: string; name: string; slug: string };
type User = { id: string; name: string; email: string; role: string; createdAt: string };
type Dashboard = { stats: { products: number; orders: number; customers: number; revenue: number; pending: number; lowStock: number }; products: Product[]; orders: Order[]; categories: Category[]; users: User[] };

const statuses = [
  ["PENDING", "در انتظار"], ["CONFIRMED", "تأییدشده"], ["PROCESSING", "در حال آماده‌سازی"],
  ["SHIPPED", "ارسال‌شده"], ["DELIVERED", "تحویل‌شده"], ["CANCELLED", "لغوشده"],
];
const toman = (n: number) => new Intl.NumberFormat("fa-IR").format(n) + " تومان";

export default function AdminPage() {
  const router = useRouter();
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [section, setSection] = useState<"overview" | "products" | "orders" | "customers">("overview");
  const [showCreate, setShowCreate] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  async function load() {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/admin", { cache: "no-store" });
      const json = await response.json();
      if (response.status === 401) { router.replace("/login?next=%2Fadmin"); return; }
      if (response.status === 403) { setError("این حساب دسترسی مدیر ندارد. برای ورود به پنل باید نقش حساب شما ADMIN باشد."); return; }
      if (!response.ok) throw new Error(json.error || "دریافت اطلاعات پنل ناموفق بود.");
      setData(json);
    } catch (e) { setError(e instanceof Error ? e.message : "خطا در دریافت اطلاعات"); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  async function action(payload: Record<string, unknown>) {
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "عملیات ناموفق بود.");
      setNotice(json.message || "تغییرات ذخیره شد.");
      setShowCreate(false); setEditProduct(null);
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "عملیات ناموفق بود."); }
    finally { setBusy(false); }
  }

  const nav = [
    { id: "overview" as const, label: "نمای کلی", icon: BarChart3 },
    { id: "products" as const, label: "محصولات", icon: Package },
    { id: "orders" as const, label: "سفارش‌ها", icon: ShoppingBag },
    { id: "customers" as const, label: "مشتریان", icon: Users },
  ];

  return <main dir="rtl" className="min-h-screen bg-[#f6f7f2] text-[#24352b]">
    <aside className="fixed inset-y-0 right-0 z-20 hidden w-64 flex-col border-l border-[#e4e9df] bg-white p-5 lg:flex">
      <Link href="/" className="flex items-center gap-3 px-2 py-4"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#254b36] text-white"><Leaf size={23}/></span><span><strong className="block text-lg">اصیل‌گیاه</strong><small className="text-xs text-gray-500">پنل مدیریت فروشگاه</small></span></Link>
      <div className="my-5 rounded-2xl bg-[#f2f5ef] p-4"><div className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck size={17}/> محیط مدیریت</div><p className="mt-1 text-xs leading-6 text-gray-500">دسترسی بر اساس نقش کاربر کنترل می‌شود.</p></div>
      <nav className="space-y-1">{nav.map(item => <button key={item.id} onClick={() => setSection(item.id)} className={"flex w-full items-center gap-3 rounded-xl px-4 py-3 text-right text-sm transition " + (section === item.id ? "bg-[#254b36] text-white" : "text-gray-600 hover:bg-gray-100")}><item.icon size={18}/>{item.label}</button>)}</nav>
      <div className="mt-auto space-y-2 border-t pt-4"><Link href="/shop" className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm text-gray-600 hover:bg-gray-100"><ExternalLink size={17}/> مشاهده فروشگاه</Link><button onClick={() => void load()} className="flex w-full items-center gap-2 rounded-xl px-4 py-3 text-sm text-gray-600 hover:bg-gray-100"><RefreshCw size={17}/> تازه‌سازی داده‌ها</button></div>
    </aside>
    <div className="lg:mr-64">
      <header className="sticky top-0 z-10 border-b border-[#e4e9df] bg-white/90 px-5 py-4 backdrop-blur md:px-8"><div className="mx-auto flex max-w-7xl items-center justify-between gap-3"><div><p className="text-xs text-gray-500">مدیریت فروشگاه / اصیل‌گیاه</p><h1 className="mt-1 text-xl font-bold md:text-2xl">{nav.find(n => n.id === section)?.label}</h1></div><div className="flex items-center gap-2"><Link href="/shop" className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50">فروشگاه <ArrowUpLeft className="mr-1 inline" size={15}/></Link><button onClick={() => void load()} aria-label="تازه‌سازی" className="rounded-xl border p-2.5 hover:bg-gray-50"><RefreshCw size={17}/></button></div></div><div className="mt-3 flex gap-2 overflow-x-auto lg:hidden">{nav.map(item => <button key={item.id} onClick={() => setSection(item.id)} className={"shrink-0 rounded-xl px-3 py-2 text-sm " + (section === item.id ? "bg-[#254b36] text-white" : "bg-gray-100")}>{item.label}</button>)}</div></header>
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">
        {error && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-7 text-red-800">{error}{error.includes("دسترسی مدیر") && <p className="mt-2"><Link className="underline" href="/account">رفتن به حساب کاربری</Link></p>}</div>}
        {notice && <div role="status" className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">{notice}</div>}
        {loading && !data ? <div className="rounded-2xl bg-white p-10 text-center text-gray-500">در حال دریافت اطلاعات از پایگاه داده…</div> : null}
        {data && section === "overview" && <>
          <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold">سلام، مدیر فروشگاه</h2><p className="mt-1 text-sm text-gray-500">نمای زنده از اطلاعات ثبت‌شده در پایگاه داده</p></div><button onClick={() => {setSection("products");setShowCreate(true)}} className="rounded-xl bg-[#254b36] px-4 py-3 text-sm font-semibold text-white hover:bg-[#1c3d2b]"><Plus className="ml-2 inline" size={17}/> افزودن محصول</button></div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[{label:"محصولات",value:data.stats.products,icon:Package,sub:"محصولات فعال"},{label:"سفارش‌ها",value:data.stats.orders,icon:ShoppingBag,sub:data.stats.pending+" سفارش در انتظار"},{label:"مشتریان",value:data.stats.customers,icon:Users,sub:"حساب‌های ثبت‌شده"},{label:"فروش ثبت‌شده",value:toman(data.stats.revenue),icon:BarChart3,sub:"سفارش‌های غیرلغوشده"}].map((s,i)=><section key={s.label} className="rounded-2xl border border-[#e7ebdf] bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><span className="text-sm text-gray-500">{s.label}</span><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#eef4eb] text-[#315a3d]"><s.icon size={20}/></span></div><p className={"mt-4 font-bold " + (i===3?"text-lg":"text-3xl")}>{s.value}</p><p className="mt-2 text-xs text-gray-500">{s.sub}</p></section>)}
          </div>
          <div className="grid gap-6 xl:grid-cols-2"><section className="rounded-2xl border border-[#e7ebdf] bg-white p-5"><div className="mb-4 flex items-center justify-between"><h3 className="font-bold">آخرین سفارش‌ها</h3><button onClick={() => setSection("orders")} className="text-sm text-[#315a3d]">همه سفارش‌ها ←</button></div><div className="space-y-3">{data.orders.slice(0,5).map(o=><div key={o.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3 last:border-0"><div><p className="font-semibold">{o.orderNumber}</p><p className="mt-1 text-xs text-gray-500">{o.customerName} · {new Date(o.createdAt).toLocaleDateString("fa-IR")}</p></div><div className="text-left"><p className="text-sm font-semibold">{toman(o.totalToman)}</p><p className="mt-1 text-xs text-gray-500">{statuses.find(s=>s[0]===o.status)?.[1] || o.status}</p></div></div>)}{data.orders.length===0&&<p className="py-6 text-sm text-gray-500">هنوز سفارشی ثبت نشده است.</p>}</div></section>
          <section className="rounded-2xl border border-[#e7ebdf] bg-white p-5"><h3 className="font-bold">نیاز به توجه</h3><div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-amber-50 p-4"><p className="text-sm text-amber-900">موجودی کم</p><p className="mt-2 text-2xl font-bold text-amber-900">{data.stats.lowStock}</p><p className="mt-1 text-xs text-amber-800">محصول با موجودی کمتر از ۵</p></div><div className="rounded-xl bg-[#f1f5ef] p-4"><p className="text-sm text-[#315a3d]">وضعیت مدیریت</p><p className="mt-2 font-bold">فعال</p><p className="mt-1 text-xs text-gray-500">عملیات فقط برای ADMIN مجاز است.</p></div></div><button onClick={()=>setSection("products")} className="mt-4 rounded-xl border px-4 py-2.5 text-sm hover:bg-gray-50">بررسی موجودی محصولات</button></section></div>
        </>}
        {data && section === "products" && <section className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold">مدیریت محصولات</h2><p className="mt-1 text-sm text-gray-500">قیمت‌ها به تومان هستند. برای حذف امن، محصول را غیرفعال کنید.</p></div><button onClick={()=>{setEditProduct(null);setShowCreate(v=>!v)}} className="rounded-xl bg-[#254b36] px-4 py-3 text-sm font-semibold text-white"><Plus className="ml-2 inline" size={17}/>{showCreate?"بستن فرم":"محصول جدید"}</button></div>
          {(showCreate || editProduct) && <ProductForm key={editProduct?.id || "new"} categories={data.categories} product={editProduct} busy={busy} onCancel={()=>{setShowCreate(false);setEditProduct(null)}} onSave={p=>void action(p)}/>}
          <div className="overflow-x-auto rounded-2xl border border-[#e7ebdf] bg-white"><table className="w-full min-w-[760px] text-right text-sm"><thead className="bg-[#f4f6f0] text-gray-600"><tr>{["محصول","SKU","قیمت","موجودی","دسته‌بندی","وضعیت","عملیات"].map(h=><th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr></thead><tbody>{data.products.map(p=><tr key={p.id} className="border-t border-gray-100"><td className="px-4 py-4"><div className="flex items-center gap-3">{p.images[0]?.url?<img src={p.images[0].url} alt="" className="h-12 w-12 rounded-lg object-cover"/>:<div className="grid h-12 w-12 place-items-center rounded-lg bg-[#eef4eb]"><Leaf size={20}/></div>}<div><p className="font-semibold">{p.name}</p><p className="mt-1 text-xs text-gray-400">{p.slug}</p></div></div></td><td className="px-4 py-4" dir="ltr">{p.sku}</td><td className="px-4 py-4 whitespace-nowrap">{toman(p.priceToman)}</td><td className="px-4 py-4"><span className={p.stock<5?"font-bold text-amber-700":""}>{p.stock}</span></td><td className="px-4 py-4">{p.category.name}</td><td className="px-4 py-4"><span className={"rounded-full px-2.5 py-1 text-xs "+(p.isActive?"bg-green-50 text-green-700":"bg-gray-100 text-gray-500")}>{p.isActive?"فعال":"غیرفعال"}</span></td><td className="px-4 py-4"><div className="flex gap-2"><button onClick={()=>{setEditProduct(p);setShowCreate(false)}} className="rounded-lg border px-3 py-2 text-xs">ویرایش</button><button disabled={busy} onClick={()=>void action({action:"product.toggle",productId:p.id})} className="rounded-lg border px-3 py-2 text-xs">{p.isActive?"غیرفعال‌سازی":"فعال‌سازی"}</button></div></td></tr>)}{data.products.length===0&&<tr><td colSpan={7} className="p-8 text-center text-gray-500">محصولی ثبت نشده است.</td></tr>}</tbody></table></div>
        </section>}
        {data && section === "orders" && <section className="space-y-4"><div><h2 className="text-lg font-bold">مدیریت سفارش‌ها</h2><p className="mt-1 text-sm text-gray-500">سفارش‌های نمایشی با پرداخت شبیه‌سازی‌شده مشخص نشده‌اند؛ این پنل پرداخت واقعی انجام نمی‌دهد.</p></div><div className="space-y-3">{data.orders.map(o=><article key={o.id} className="rounded-2xl border border-[#e7ebdf] bg-white p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-bold">{o.orderNumber}</p><p className="mt-1 text-sm text-gray-500">{o.customerName} · {o.email}</p><p className="mt-1 text-xs text-gray-400">{new Date(o.createdAt).toLocaleString("fa-IR")}</p></div><div className="text-left"><p className="font-bold">{toman(o.totalToman)}</p><p className="mt-1 text-xs text-gray-500">{o.items.reduce((sum,i)=>sum+i.quantity,0)} عدد محصول</p></div></div><div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4"><p className="text-sm text-gray-600">{o.items.map(i=>i.productNameSnapshot+" × "+i.quantity).join("، ")}</p><form onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);void action({action:"order.status",orderId:o.id,status:f.get("status")})}} className="flex gap-2"><select name="status" defaultValue={o.status} className="max-w-[180px] rounded-xl border bg-white px-3 py-2 text-sm">{statuses.map(s=><option key={s[0]} value={s[0]}>{s[1]}</option>)}</select><button disabled={busy} className="rounded-xl bg-[#254b36] px-3 py-2 text-sm text-white">ذخیره وضعیت</button></form></div></article>)}{data.orders.length===0&&<div className="rounded-2xl bg-white p-10 text-center text-gray-500">هنوز سفارشی ثبت نشده است.</div>}</div></section>}
        {data && section === "customers" && <section className="space-y-4"><div><h2 className="text-lg font-bold">مشتریان</h2><p className="mt-1 text-sm text-gray-500">اطلاعات حساب‌های ثبت‌شده؛ رمز عبور هیچ‌گاه نمایش داده نمی‌شود.</p></div><div className="overflow-x-auto rounded-2xl border border-[#e7ebdf] bg-white"><table className="w-full min-w-[600px] text-right text-sm"><thead className="bg-[#f4f6f0]"><tr>{["نام","ایمیل","نقش","تاریخ عضویت"].map(h=><th key={h} className="px-4 py-3">{h}</th>)}</tr></thead><tbody>{data.users.map(u=><tr key={u.id} className="border-t"><td className="px-4 py-4 font-semibold">{u.name}</td><td className="px-4 py-4" dir="ltr">{u.email}</td><td className="px-4 py-4">{u.role==="ADMIN"?"مدیر":"مشتری"}</td><td className="px-4 py-4">{new Date(u.createdAt).toLocaleDateString("fa-IR")}</td></tr>)}</tbody></table></div></section>}
        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-[#e1e7dc] pt-5 text-xs text-gray-500"><span>اصیل‌گیاه · پنل مدیریت</span><span>آمار بر اساس داده‌های فعلی پایگاه داده است.</span></footer>
      </div>
    </div>
  </main>;
}

function ProductForm({ categories, product, busy, onCancel, onSave }: { categories: Category[]; product: Product | null; busy: boolean; onCancel: () => void; onSave: (p: Record<string, unknown>) => void }) {
  const [message, setMessage] = useState("");
  const [imageUrl, setImageUrl] = useState(product?.images[0]?.url || "");
  return <form onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);onSave({action:product?"product.update":"product.create",productId:product?.id,name:f.get("name"),slug:f.get("slug"),sku:f.get("sku"),description:f.get("description"),shortDescription:f.get("shortDescription"),priceToman:f.get("priceToman"),stock:f.get("stock"),categoryId:f.get("categoryId"),imageUrl,isActive:f.get("isActive")==="on",isFeatured:f.get("isFeatured")==="on"})}} className="rounded-2xl border border-[#dce5d7] bg-white p-5 md:p-6">
    <h3 className="font-bold">{product?"ویرایش محصول":"افزودن محصول جدید"}</h3><p className="mt-1 text-xs leading-6 text-gray-500">اسلاگ انگلیسی و یکتا باشد؛ تصویر باید از یک نشانی HTTPS یا HTTP قابل‌دسترسی ارائه شود.</p>
    <div className="mt-5 grid gap-4 md:grid-cols-2">
      <label className="text-sm">نام محصول<input name="name" required minLength={2} defaultValue={product?.name||""} className="mt-2 w-full rounded-xl border px-3 py-2.5"/></label>
      <label className="text-sm">اسلاگ انگلیسی<input name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" dir="ltr" defaultValue={product?.slug||""} placeholder="herbal-tea" className="mt-2 w-full rounded-xl border px-3 py-2.5"/></label>
      <label className="text-sm">کد SKU<input name="sku" required pattern="[A-Za-z0-9_-]+" dir="ltr" defaultValue={product?.sku||""} className="mt-2 w-full rounded-xl border px-3 py-2.5"/></label>
      <label className="text-sm">دسته‌بندی<select name="categoryId" required defaultValue={product?.categoryId||""} className="mt-2 w-full rounded-xl border bg-white px-3 py-2.5"><option value="" disabled>انتخاب کنید</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      <label className="text-sm">قیمت (تومان)<input name="priceToman" type="number" min="0" max="2000000000" required defaultValue={product?.priceToman??0} className="mt-2 w-full rounded-xl border px-3 py-2.5"/></label>
      <label className="text-sm">موجودی<input name="stock" type="number" min="0" max="1000000" required defaultValue={product?.stock??0} className="mt-2 w-full rounded-xl border px-3 py-2.5"/></label>
      <label className="text-sm md:col-span-2">توضیح کوتاه<input name="shortDescription" required defaultValue={product?.shortDescription||""} className="mt-2 w-full rounded-xl border px-3 py-2.5"/></label>
      <label className="text-sm md:col-span-2">توضیحات کامل<textarea name="description" required rows={4} defaultValue={product?.description||""} className="mt-2 w-full rounded-xl border px-3 py-2.5"/></label>
      <label className="text-sm md:col-span-2">آدرس تصویر<input type="url" value={imageUrl} onChange={e=>setImageUrl(e.target.value)} placeholder="https://example.com/product.jpg" className="mt-2 w-full rounded-xl border px-3 py-2.5" dir="ltr"/></label>
    </div>
    <div className="mt-4 flex flex-wrap gap-5 text-sm"><label className="flex items-center gap-2"><input name="isActive" type="checkbox" defaultChecked={product?.isActive??true}/> محصول فعال باشد</label><label className="flex items-center gap-2"><input name="isFeatured" type="checkbox" defaultChecked={product?.isFeatured??false}/> محصول ویژه</label></div>
    <div className="mt-5 flex gap-2"><button disabled={busy} className="rounded-xl bg-[#254b36] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{busy?"در حال ذخیره…":"ذخیره محصول"}</button><button type="button" onClick={onCancel} className="rounded-xl border px-5 py-3 text-sm">انصراف</button></div>
  </form>;
}
