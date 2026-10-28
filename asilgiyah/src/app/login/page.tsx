"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
export default function LoginPage(){
 const router=useRouter(); const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [error,setError]=useState(""); const [busy,setBusy]=useState(false);
 async function submit(e:any){e.preventDefault();setError("");setBusy(true);try{const r=await fetch("/api/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,password})});const d=await r.json();if(!r.ok){setError(d.error||"ورود انجام نشد.");return;}router.push("/account");router.refresh();}catch{setError("ارتباط برقرار نشد. دوباره تلاش کنید.");}finally{setBusy(false);}}
 return <><Header/><main className="container-wide flex min-h-[65vh] items-center justify-center py-12"><section className="w-full max-w-lg rounded-3xl border border-[#eee9df] bg-white p-8"><h1 className="text-3xl font-bold text-forest">ورود به حساب کاربری</h1><form onSubmit={submit} className="mt-7 space-y-5"><label className="block text-sm">ایمیل<input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} className="mt-2 w-full rounded-xl border px-4 py-3" dir="ltr"/></label><label className="block text-sm">رمز عبور<input required type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-2 w-full rounded-xl border px-4 py-3" dir="ltr"/></label>{error&&<p role="alert" className="text-sm text-red-700">{error}</p>}<button disabled={busy} className="btn-primary w-full" type="submit">{busy?"در حال ورود...":"ورود"}</button></form><p className="mt-6 text-center text-sm">حساب نداری؟ <Link className="underline" href="/register">ثبت‌نام</Link></p></section></main><Footer/></>;
}