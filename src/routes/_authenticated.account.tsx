import { useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, ChevronLeft, CircleUserRound, Home, ImagePlus, LoaderCircle, LogOut, MapPin, Package, Pencil, Plus, ShieldCheck, Store, Trash2, UserRound, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { money } from "@/components/storefront/catalog";
import { cancelMyOrder } from "@/lib/order-cancel.functions";
import { withTurboOverlay } from "@/components/storefront/page-transition";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({
    meta: [
      { title: "حسابي — TURBO" },
      { name: "description", content: "تابع طلباتك وبيانات حساب TURBO." },
      { property: "og:title", content: "حسابي في TURBO" },
      { property: "og:description", content: "طلباتك وبياناتك في مكان واحد." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Page,
});

const statusLabel = { pending: "قيد المراجعة", confirmed: "تم التأكيد", processing: "قيد التجهيز", shipped: "خرج للتوصيل", delivered: "تم التوصيل", cancelled: "ملغي" } as const;
type Address = { id: string; label: string | null; recipient_name: string; phone: string; governorate: string; city: string; street_address: string; building_details: string | null; landmark: string | null; is_default: boolean };
const emptyAddress = { label: "المنزل", recipient_name: "", phone: "", governorate: "", city: "", street_address: "", building_details: "", landmark: "", is_default: false };
const SIZE_OPTIONS = ["S", "M", "L", "XL", "2XL", "3XL", "4XL"] as const;

function Page() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [sizeChoice, setSizeChoice] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState<typeof emptyAddress & { id?: string } | null>(null);

  const googleName = typeof user.user_metadata['full_name'] === "string" ? user.user_metadata['full_name'] : typeof user.user_metadata['name'] === "string" ? user.user_metadata['name'] : "";
  const googleAvatar = typeof user.user_metadata['avatar_url'] === "string" ? user.user_metadata['avatar_url'] : typeof user.user_metadata['picture'] === "string" ? user.user_metadata['picture'] : "";

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["my-profile", user.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("full_name,phone,avatar_url,preferred_size").eq("id", user.id).maybeSingle();
      if (error) throw error;
      if (data) return data;
      const fallback = { id: user.id, full_name: googleName || null, phone: typeof user.user_metadata['phone'] === "string" ? user.user_metadata['phone'] : null, avatar_url: googleAvatar || null };
      const { data: created, error: createError } = await supabase.from("profiles").upsert(fallback).select("full_name,phone,avatar_url,preferred_size").single();
      if (createError) throw createError;
      return created;
    },
  });

  // الصور المرفوعة محفوظة في مساحة خاصة، فنولّد لها رابط عرض مؤقت
  const storedAvatar = profile?.avatar_url ?? "";
  const { data: signedAvatar = "" } = useQuery({
    queryKey: ["my-avatar", user.id, storedAvatar],
    enabled: Boolean(storedAvatar) && !storedAvatar.startsWith("http"),
    queryFn: async () => {
      const { data } = await supabase.storage.from("avatars").createSignedUrl(storedAvatar, 60 * 60 * 12);
      return data?.signedUrl ?? "";
    },
  });

  const uploadAvatar = async (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("اختار صورة صحيحة"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("حجم الصورة أكبر من 5 ميجا"); return; }
    setUploadingAvatar(true);
    const extension = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${user.id}/avatar-${Date.now()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
    if (!uploadError) await supabase.from("profiles").upsert({ id: user.id, avatar_url: path });
    setUploadingAvatar(false);
    if (uploadError) { toast.error("تعذر رفع الصورة"); return; }
    await queryClient.invalidateQueries({ queryKey: ["my-profile", user.id] });
    toast.success("اتغيرت صورتك");
  };



  const { data: addresses = [], isLoading: addressesLoading } = useQuery({
    queryKey: ["my-addresses", user.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("addresses").select("id,label,recipient_name,phone,governorate,city,street_address,building_details,landmark,is_default").eq("user_id", user.id).order("is_default", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Address[];
    },
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["my-orders", user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id,order_number,grand_total,fulfillment_status,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: accountRole } = useQuery({
    queryKey: ["my-wholesale", user.id],
    queryFn: async () => {
      const [{ data: roles }, { data: application }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", user.id),
        supabase.from("wholesale_applications").select("status").eq("user_id", user.id).maybeSingle(),
      ]);
      const names = (roles ?? []).map((r) => r.role);
      const isAdmin = names.includes("admin") || names.includes("super_admin");
      const status = names.includes("wholesale") ? ("approved" as const) : application?.status ?? null;
      return { isAdmin, status };
    },
  });
  const wholesale = accountRole?.status ?? null;
  const isAdmin = accountRole?.isAdmin ?? false;

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success("تم تسجيل الخروج");
    navigate({ to: "/" });
  };

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingProfile(true);
    const fd = new FormData(event.currentTarget);
    const fullName = String(fd.get("fullName") ?? "").trim();
    const phone = String(fd.get("phone") ?? "").trim();
    const preferredSize = sizeChoice ?? profile?.preferred_size ?? "";
    const email = String(fd.get("email") ?? "").trim();
    if (phone && !/^01[0125][0-9]{8}$/.test(phone)) { setSavingProfile(false); toast.error("اكتب رقم موبايل مصري صحيح"); return; }
    const { error } = await supabase.from("profiles").upsert({ id: user.id, full_name: fullName, phone: phone || null, preferred_size: preferredSize || null });
    let emailError = null;
    if (!error && email && email !== user.email) ({ error: emailError } = await supabase.auth.updateUser({ email }));
    setSavingProfile(false);
    if (error || emailError) { toast.error("تعذر حفظ البيانات"); return; }
    await queryClient.invalidateQueries({ queryKey: ["my-profile", user.id] });
    toast.success(email !== user.email ? "اتحفظت البيانات — أكد البريد الجديد من الرسالة" : "اتحفظت بياناتك");
  };

  const saveAddress = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!addressForm) return;
    if (!/^01[0125][0-9]{8}$/.test(addressForm.phone)) { toast.error("راجع رقم موبايل العنوان"); return; }
    setSavingAddress(true);
    if (addressForm.is_default) await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id);
    const payload = { user_id: user.id, label: addressForm.label.trim(), recipient_name: addressForm.recipient_name.trim(), phone: addressForm.phone, governorate: addressForm.governorate.trim(), city: addressForm.city.trim(), street_address: addressForm.street_address.trim(), building_details: addressForm.building_details.trim() || null, landmark: addressForm.landmark.trim() || null, is_default: addressForm.is_default || addresses.length === 0 };
    const response = addressForm.id ? await supabase.from("addresses").update(payload).eq("id", addressForm.id) : await supabase.from("addresses").insert(payload);
    setSavingAddress(false);
    if (response.error) { toast.error("تعذر حفظ العنوان"); return; }
    setAddressForm(null);
    await queryClient.invalidateQueries({ queryKey: ["my-addresses", user.id] });
    toast.success("اتحفظ العنوان");
  };

  const deleteAddress = async (id: string) => {
    const { error } = await supabase.from("addresses").delete().eq("id", id);
    if (error) { toast.error("تعذر حذف العنوان"); return; }
    await queryClient.invalidateQueries({ queryKey: ["my-addresses", user.id] });
    toast.success("اتحذف العنوان");
  };

  const changePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingPassword(true);
    const fd = new FormData(event.currentTarget);
    const currentPassword = String(fd.get("currentPassword") ?? "");
    const password = String(fd.get("newPassword") ?? "");
    const confirmation = String(fd.get("newPasswordConfirm") ?? "");
    if (password !== confirmation) { setSavingPassword(false); toast.error("كلمتا المرور الجديدتان غير متطابقتين"); return; }
    const { error } = await supabase.auth.updateUser({ password, current_password: currentPassword });
    setSavingPassword(false);
    if (error) { toast.error("تعذر تغيير كلمة المرور", { description: "راجع كلمة المرور الحالية وحاول تاني." }); return; }
    event.currentTarget.reset();
    toast.success("تم تغيير كلمة المرور");
  };

  const wholesaleCard = wholesale === "approved"
    ? { to: "/wholesale" as const, title: "بوابة تجار الجملة", desc: "أسعار الجملة وطلبات الكمية" }
    : wholesale === "pending"
      ? { to: "/wholesale-apply" as const, title: "طلب الجملة قيد المراجعة", desc: "هنوافيك بالنتيجة قريبًا" }
      : { to: "/wholesale-apply" as const, title: "قدّم كتاجر جملة", desc: "افتح أسعار الجملة لمحلك" };

  const displayName = profile?.full_name || googleName || "لاعب TURBO";
  const avatarUrl = (storedAvatar.startsWith("http") ? storedAvatar : signedAvatar) || googleAvatar;
  const activeSize = sizeChoice ?? profile?.preferred_size ?? "";

  return (
    <div className="min-h-[70vh] bg-off-white">
      <section className="bg-brand-black text-primary-foreground">
        <div className="turbo-container flex flex-col gap-6 py-9 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-primary bg-primary text-xl font-bold text-primary-foreground">
              {avatarUrl ? <img src={avatarUrl} alt={displayName} className="size-full object-cover" referrerPolicy="no-referrer"/> : <span>{displayName.slice(0, 2)}</span>}
            </div>
            <div><p className="text-xs font-bold text-primary">MY TURBO</p><h1 className="mt-1 text-3xl font-extrabold sm:text-4xl">أهلاً، {displayName.split(" ")[0]}</h1><p dir="ltr" className="mt-1 text-start text-sm text-primary-foreground/60">{user.email}</p></div>
          </div>
          <Button variant="outline" className="border-primary-foreground/25 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground" onClick={signOut}><LogOut /> تسجيل الخروج</Button>
        </div>
      </section>

      <div className="turbo-container py-8 sm:py-12">
        {isAdmin && (
          <Link to="/admin/wholesale" className="mb-4 flex items-center justify-between gap-4 rounded-[10px] border border-primary bg-primary/5 p-5 transition-colors hover:bg-primary/10">
            <div className="flex items-center gap-4">
              <span className="grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground"><ShieldCheck className="size-5"/></span>
              <div><strong className="block">لوحة الإدارة — طلبات تجار الجملة</strong><p className="mt-1 text-sm text-muted-foreground">راجع الطلبات ووافق أو ارفض</p></div>
            </div>
            <ChevronLeft className="size-5 text-primary" aria-hidden="true" />
          </Link>
        )}
        <Link to={wholesaleCard.to} className="flex items-center justify-between gap-4 rounded-[10px] border bg-card p-5 transition-colors hover:border-primary">
          <div className="flex items-center gap-4">
            <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary"><Store className="size-5"/></span>
            <div><strong className="block">{wholesaleCard.title}</strong><p className="mt-1 text-sm text-muted-foreground">{wholesaleCard.desc}</p></div>
          </div>
          <ChevronLeft className="size-5 text-muted-foreground" aria-hidden="true" />
        </Link>

        <Tabs defaultValue="profile" className="mt-8">
          <TabsList className="grid h-auto w-full grid-cols-3 bg-card p-1.5 shadow-card sm:w-fit"><TabsTrigger value="profile" className="gap-2 px-4 py-2.5"><UserRound className="size-4"/> بياناتي</TabsTrigger><TabsTrigger value="addresses" className="gap-2 px-4 py-2.5"><MapPin className="size-4"/> العناوين</TabsTrigger><TabsTrigger value="orders" className="gap-2 px-4 py-2.5"><Package className="size-4"/> الطلبات</TabsTrigger></TabsList>

          <TabsContent value="profile" className="mt-6 rounded-[10px] border bg-card p-5 sm:p-8">
            <div className="flex items-center gap-3"><CircleUserRound className="size-6 text-primary"/><div><h2 className="text-xl font-bold">بيانات الحساب</h2><p className="text-sm text-muted-foreground">عدّل بياناتك اللي بتظهر في الطلبات.</p></div></div>
            {profileLoading ? <Skeleton className="mt-6 h-64"/> : <form onSubmit={saveProfile} className="mt-7 grid gap-5 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-bold">الاسم بالكامل<Input name="fullName" required minLength={2} maxLength={100} defaultValue={displayName}/></label>
              <label className="grid gap-2 text-sm font-bold">رقم الموبايل<Input name="phone" type="tel" dir="ltr" inputMode="numeric" maxLength={11} defaultValue={profile?.phone ?? ""}/></label>
              <label className="grid gap-2 text-sm font-bold">البريد الإلكتروني<Input name="email" type="email" dir="ltr" required defaultValue={user.email ?? ""}/><span className="font-normal text-muted-foreground">تغييره يحتاج تأكيد البريد الجديد.</span></label>
              <div className="grid gap-2 text-sm font-bold sm:col-span-2">المقاس المفضل
                <div className="flex flex-wrap gap-2">{SIZE_OPTIONS.map((size)=>(<Button key={size} type="button" size="sm" variant={activeSize===size?"default":"outline"} onClick={()=>setSizeChoice(activeSize===size?"":size)} aria-pressed={activeSize===size}><span dir="ltr">{size}</span></Button>))}</div>
                <span className="font-normal text-muted-foreground">هنختار مقاسك تلقائيًا في صفحة المنتج لو كان متاح.</span>
              </div>
              <div className="grid gap-2 text-sm font-bold sm:col-span-2">صورة الحساب
                <div className="flex flex-wrap items-center gap-4">
                  <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-full border bg-muted text-sm">{avatarUrl ? <img src={avatarUrl} alt="" className="size-full object-cover" referrerPolicy="no-referrer"/> : <span>{displayName.slice(0,2)}</span>}</div>
                  <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-input bg-background px-4 text-sm font-bold hover:border-primary">
                    {uploadingAvatar ? <LoaderCircle className="size-4 animate-spin"/> : <ImagePlus className="size-4"/>} ارفع صورة من جهازك
                    <input type="file" accept="image/*" className="hidden" disabled={uploadingAvatar} onChange={(event)=>{const file=event.target.files?.[0]; event.target.value=""; if(file) void uploadAvatar(file);}}/>
                  </label>
                </div>
                <span className="font-normal text-muted-foreground">صورة Google تظهر تلقائيًا، ويمكنك رفع صورة بحد 5 ميجا.</span>
              </div>
              <Button type="submit" className="sm:col-span-2 sm:w-fit" disabled={savingProfile}>{savingProfile ? <LoaderCircle className="animate-spin"/> : <Check/>} حفظ التعديلات</Button>
            </form>}
            <form onSubmit={changePassword} className="mt-8 grid gap-5 border-t pt-7 sm:grid-cols-3"><div className="sm:col-span-3"><h3 className="font-bold">تغيير كلمة المرور</h3><p className="mt-1 text-sm text-muted-foreground">متاح للحسابات اللي اتعملت بالبريد وكلمة المرور.</p></div><label className="grid gap-2 text-sm font-bold">كلمة المرور الحالية<Input required name="currentPassword" type="password" autoComplete="current-password" minLength={8}/></label><label className="grid gap-2 text-sm font-bold">كلمة المرور الجديدة<Input required name="newPassword" type="password" autoComplete="new-password" minLength={8}/></label><label className="grid gap-2 text-sm font-bold">تأكيد كلمة المرور<Input required name="newPasswordConfirm" type="password" autoComplete="new-password" minLength={8}/></label><Button type="submit" variant="secondary" className="sm:col-span-3 sm:w-fit" disabled={savingPassword}>{savingPassword?<LoaderCircle className="animate-spin"/>:<ShieldCheck/>} تغيير كلمة المرور</Button></form>
          </TabsContent>

          <TabsContent value="addresses" className="mt-6">
            <div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-2xl font-bold">عناوين التوصيل</h2><p className="mt-1 text-sm text-muted-foreground">اختار عنوانك بسرعة عند الطلب.</p></div><Button onClick={() => setAddressForm({ ...emptyAddress, recipient_name: displayName, phone: profile?.phone ?? "", is_default: addresses.length === 0 })}><Plus/> عنوان جديد</Button></div>
            {addressForm && <form onSubmit={saveAddress} className="mt-5 grid gap-4 rounded-[10px] border bg-card p-5 sm:grid-cols-2 sm:p-6">
              <label className="grid gap-2 text-sm font-bold">اسم العنوان<Input required maxLength={50} value={addressForm.label} onChange={e=>setAddressForm({...addressForm,label:e.target.value})}/></label><label className="grid gap-2 text-sm font-bold">اسم المستلم<Input required minLength={2} maxLength={100} value={addressForm.recipient_name} onChange={e=>setAddressForm({...addressForm,recipient_name:e.target.value})}/></label>
              <label className="grid gap-2 text-sm font-bold">رقم الموبايل<Input required dir="ltr" inputMode="numeric" maxLength={11} value={addressForm.phone} onChange={e=>setAddressForm({...addressForm,phone:e.target.value.replace(/\D/g,"").slice(0,11)})}/></label><label className="grid gap-2 text-sm font-bold">المحافظة<Input required minLength={2} maxLength={60} value={addressForm.governorate} onChange={e=>setAddressForm({...addressForm,governorate:e.target.value})}/></label>
              <label className="grid gap-2 text-sm font-bold">المدينة<Input required minLength={2} maxLength={100} value={addressForm.city} onChange={e=>setAddressForm({...addressForm,city:e.target.value})}/></label><label className="grid gap-2 text-sm font-bold">تفاصيل المبنى<Input maxLength={200} value={addressForm.building_details} onChange={e=>setAddressForm({...addressForm,building_details:e.target.value})}/></label>
              <label className="grid gap-2 text-sm font-bold sm:col-span-2">العنوان بالتفصيل<Input required minLength={5} maxLength={300} value={addressForm.street_address} onChange={e=>setAddressForm({...addressForm,street_address:e.target.value})}/></label><label className="grid gap-2 text-sm font-bold sm:col-span-2">علامة مميزة<Input maxLength={200} value={addressForm.landmark} onChange={e=>setAddressForm({...addressForm,landmark:e.target.value})}/></label>
              <label className="flex items-center gap-3 text-sm font-bold sm:col-span-2"><input type="checkbox" checked={addressForm.is_default} onChange={e=>setAddressForm({...addressForm,is_default:e.target.checked})}/> اجعله العنوان الافتراضي</label><div className="flex gap-3 sm:col-span-2"><Button type="submit" disabled={savingAddress}>{savingAddress?<LoaderCircle className="animate-spin"/>:<Check/>} حفظ العنوان</Button><Button type="button" variant="outline" onClick={()=>setAddressForm(null)}>إلغاء</Button></div>
            </form>}
            {addressesLoading ? <Skeleton className="mt-5 h-36"/> : addresses.length ? <div className="mt-5 grid gap-4 md:grid-cols-2">{addresses.map(address=><article key={address.id} className="rounded-[10px] border bg-card p-5"><div className="flex items-start justify-between gap-4"><span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary"><Home className="size-5"/></span>{address.is_default&&<span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">الافتراضي</span>}</div><h3 className="mt-4 font-bold">{address.label || "عنوان"}</h3><p className="mt-2 text-sm leading-7 text-muted-foreground">{address.recipient_name} · {address.phone}<br/>{address.governorate}، {address.city}، {address.street_address}</p><div className="mt-4 flex gap-2"><Button size="sm" variant="outline" onClick={()=>setAddressForm({...address,label:address.label??"",building_details:address.building_details??"",landmark:address.landmark??""})}><Pencil/> تعديل</Button><Button size="sm" variant="ghost" onClick={()=>deleteAddress(address.id)}><Trash2/> حذف</Button></div></article>)}</div> : <div className="mt-5 grid place-items-center rounded-[10px] border border-dashed bg-card p-10 text-center"><MapPin className="size-9 text-primary"/><p className="mt-3 font-bold">لسه مفيش عنوان محفوظ</p></div>}
          </TabsContent>

          <TabsContent value="orders" className="mt-6"><section>
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-bold">الطلبات</h2>
          <span className="text-sm text-muted-foreground">{orders.length} طلب</span>
        </div>
        {ordersLoading ? (
          <div className="mt-5 grid gap-3">{[0, 1].map((i) => <Skeleton key={i} className="h-24 rounded-[10px]" />)}</div>
        ) : orders.length ? (
          <div className="mt-5 grid gap-3">
            {orders.map((o) => (
              <div key={o.id} className="flex flex-wrap items-center justify-between gap-4 rounded-[10px] border bg-card p-5">
                <div className="flex items-center gap-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Package className="size-5" /></span>
                  <div>
                    <strong dir="ltr">#{o.order_number}</strong>
                    <p className="mt-1 text-sm text-muted-foreground">{new Date(o.created_at).toLocaleDateString("ar-EG", { day: "numeric", month: "long", year: "numeric" })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-end">
                    <strong>{money(o.grand_total)}</strong>
                    <p className="mt-1 text-sm font-semibold text-primary">{statusLabel[o.fulfillment_status] ?? o.fulfillment_status}</p>
                  </div>
                  <ChevronLeft className="size-4 text-muted-foreground" aria-hidden="true" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-5 grid place-items-center gap-4 rounded-[10px] border border-dashed p-10 text-center">
            <span className="grid size-14 place-items-center rounded-full bg-primary/10 text-primary"><Package className="size-6" /></span>
            <div>
              <p className="font-bold">مفيش طلبات لسه</p>
              <p className="mt-1 text-sm text-muted-foreground">ابدأ التسوق وأول طلب هيظهر هنا.</p>
            </div>
            <Button asChild><Link to="/shop">تسوق الآن</Link></Button>
          </div>
        )}
      </section></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
