import { useEffect, useRef, useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BadgeCheck, CheckCircle2, KeyRound, LoaderCircle, Lock, MailCheck, Package, Phone, Store, UserRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import logo from "@/assets/turbo-logo.svg.asset.json";
import mark from "@/assets/turbo-mark.svg.asset.json";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "حسابك — TURBO" },
      { name: "description", content: "سجل الدخول إلى حساب TURBO لمتابعة الطلبات وطلبات الجملة." },
      { property: "og:title", content: "حساب TURBO" },
      { property: "og:description", content: "تابع طلباتك وبياناتك بأمان." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <path fill="#EA4335" d="M12 5.04c1.62 0 3.06.56 4.2 1.64l3.12-3.12C17.46 1.8 14.96.72 12 .72 7.44.72 3.56 3.34 1.7 7.32l3.66 2.84C6.24 7.22 8.88 5.04 12 5.04z" />
      <path fill="#4285F4" d="M23.28 12.26c0-.8-.08-1.56-.2-2.3H12v4.5h6.32c-.28 1.44-1.1 2.66-2.34 3.48l3.6 2.8c2.1-1.94 3.7-4.82 3.7-8.48z" />
      <path fill="#FBBC05" d="M5.36 14.3a7.2 7.2 0 0 1 0-4.56L1.7 6.9a11.28 11.28 0 0 0 0 10.14l3.66-2.74z" />
      <path fill="#34A853" d="M12 23.28c3.04 0 5.6-1 7.46-2.72l-3.6-2.8c-1 .68-2.3 1.08-3.86 1.08-3.12 0-5.76-2.18-6.64-5.12l-3.66 2.84c1.86 3.98 5.74 6.72 10.3 6.72z" />
    </svg>
  );
}

const perks = [
  { icon: Package, text: "تابع طلباتك لحظة بلحظة" },
  { icon: Store, text: "قدّم كتاجر جملة وافتح أسعار الجملة" },
  { icon: BadgeCheck, text: "استبدال سهل خلال 14 يوم" },
] as const;

function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [confirmationEmail, setConfirmationEmail] = useState("");
  const [confirmationCode, setConfirmationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [reset, setReset] = useState<null | { stage: "request" | "code" | "choice" | "password"; email: string }>(null);
  const [resetCode, setResetCode] = useState("");
  const holdRedirect = useRef(false);
  const navigate = useNavigate();

  // بعد الرجوع من جوجل: لو الجلسة اتعملت انقل مباشرة للحساب
  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (active && !holdRedirect.current && data.user) navigate({ to: "/account", replace: true });
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active && !holdRedirect.current && session?.user) navigate({ to: "/account", replace: true });
    });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, [navigate]);

  const requestReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("resetEmail") ?? "").trim().toLowerCase();
    setLoading(true);
    holdRedirect.current = true;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + "/auth" });
    setLoading(false);
    if (error) { toast.error("تعذر إرسال كود الاستعادة", { description: error.message }); return; }
    setReset({ stage: "code", email });
    setResetCode("");
    toast.success("بعتنا لك كود استعادة على بريدك");
  };

  const verifyResetCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!reset) return;
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({ email: reset.email, token: resetCode.replace(/\D/g, ""), type: "recovery" });
    setLoading(false);
    if (error) { toast.error("الكود غير صحيح أو انتهت صلاحيته", { description: "اطلب كود جديد وجرب تاني." }); return; }
    setReset({ stage: "choice", email: reset.email });
    toast.success("تم التحقق من بريدك");
  };

  const resendResetCode = async () => {
    if (!reset) return;
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(reset.email, { redirectTo: window.location.origin + "/auth" });
    setLoading(false);
    error
      ? toast.error("تعذر إعادة إرسال الكود", { description: error.message })
      : toast.success("بعتنا لك كود جديد", { description: "استخدم آخر كود فقط." });
  };

  const savePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const password = String(fd.get("newPassword") ?? "");
    if (password !== String(fd.get("newPasswordConfirm") ?? "")) { toast.error("كلمتا المرور غير متطابقتين"); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { toast.error("تعذر تغيير كلمة المرور", { description: error.message }); return; }
    toast.success("تم تغيير كلمة المرور");
    holdRedirect.current = false;
    setReset(null);
    navigate({ to: "/account", replace: true });
  };

  const enterAccount = () => {
    holdRedirect.current = false;
    setReset(null);
    navigate({ to: "/account", replace: true });
  };

  const closeReset = () => {
    holdRedirect.current = false;
    setReset(null);
    setResetCode("");
  };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim().toLowerCase();
    const password = String(fd.get("password") ?? "");
    const fullName = String(fd.get("fullName") ?? "").trim();
    const phone = String(fd.get("phone") ?? "").trim();
    const passwordConfirm = String(fd.get("passwordConfirm") ?? "");
    if (mode === "signup" && (!/^01[0125][0-9]{8}$/.test(phone) || fullName.length < 2)) {
      setLoading(false);
      toast.error("راجع الاسم ورقم الموبايل");
      return;
    }
    if (mode === "signup" && password !== passwordConfirm) {
      setLoading(false);
      toast.error("كلمتا المرور غير متطابقتين");
      return;
    }
    const result = mode === "signin"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + "/auth", data: { full_name: fullName, phone } } });
    setLoading(false);
    if (result.error) {
      toast.error(mode === "signin" ? "بيانات الدخول غير صحيحة" : "تعذر إنشاء الحساب", { description: result.error.message });
      return;
    }
    if (mode === "signup" && !result.data.session) {
      if (result.data.user?.identities?.length === 0) {
        setMode("signin");
        toast.error("البريد ده عليه حساب بالفعل", { description: "سجّل دخول بكلمة المرور بدل إنشاء حساب جديد." });
        return;
      }
      setConfirmationEmail(email);
      toast.success("بعتنا لك كود تأكيد على بريدك");
      return;
    }
    toast.success("أهلاً بيك في TURBO");
    navigate({ to: "/account", replace: true });
  };

  const verifyCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    // الكود المرسل قد يكون من نوع signup أو email حسب طريقة الإرسال، فنجرب الاثنين
    const token = confirmationCode.replace(/\D/g, "");
    const email = confirmationEmail.trim().toLowerCase();
    let result = await supabase.auth.verifyOtp({ email, token, type: "signup" });
    if (result.error) result = await supabase.auth.verifyOtp({ email, token, type: "email" });
    const { data, error } = result;
    if (!error && data.user) {
      const metadata = data.user.user_metadata;
      await supabase.from("profiles").upsert({ id: data.user.id, full_name: typeof metadata['full_name'] === "string" ? metadata['full_name'] : null, phone: typeof metadata['phone'] === "string" ? metadata['phone'] : null });
    }
    setLoading(false);
    if (error) { toast.error("الكود غير صحيح أو انتهت صلاحيته", { description: "استخدم آخر كود وصلك، أو اطلب كود جديد." }); return; }
    toast.success("تم تأكيد حسابك");
    navigate({ to: "/account", replace: true });
  };

  const resendCode = async () => {
    setLoading(true);
    const { error } = await supabase.auth.resend({ type: "signup", email: confirmationEmail.trim().toLowerCase(), options: { emailRedirectTo: window.location.origin + "/auth" } });
    setLoading(false);
    error
      ? toast.error("تعذر إعادة إرسال الكود", { description: error.message })
      : toast.success("بعتنا لك كود جديد", { description: "استخدم آخر كود فقط؛ الأكواد الأقدم بتتلغي." });
  };

  const google = async () => {
    setGoogleLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
      if (result.error) {
        toast.error("تعذر الدخول بجوجل", { description: result.error.message });
        return;
      }
      if (result.redirected) return; // الصفحة هتنتقل وتكمل بعد الرجوع
      const { data } = await supabase.auth.getUser();
      if (result.tokens || data.user) {
        toast.success("أهلاً بيك في TURBO");
        navigate({ to: "/account", replace: true });
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const busy = loading || googleLoading;

  return (
    <div className="turbo-container section-space">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-[12px] border border-border bg-card shadow-card md:grid-cols-[0.9fr_1.1fr]">
        <aside className="spotlight-shell relative hidden flex-col justify-between bg-brand-black p-8 text-primary-foreground md:flex">
          <div className="spotlight-glow pointer-events-none absolute inset-0" aria-hidden="true" />
          <div className="relative">
            <img src={mark.url} alt="" className="h-14 w-14 object-contain" aria-hidden="true" />
            <h2 className="mt-6 text-3xl font-bold leading-snug">اتحرك. العب. كمل.</h2>
            <p className="mt-3 text-sm leading-7 text-primary-foreground/70">حساب واحد يفتح لك الطلبات، العناوين، وبوابة تجار الجملة.</p>
          </div>
          <ul className="relative mt-10 grid gap-4">
            {perks.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary-foreground/10 text-primary"><Icon className="size-4" /></span>
                {text}
              </li>
            ))}
          </ul>
        </aside>

        <div className="p-6 sm:p-8">
          <img src={logo.url} alt="TURBO" className="mx-auto h-12 w-40 object-contain md:mx-0 md:justify-self-start" />
          {reset ? <div className="mt-8">
            <span className="grid size-14 place-items-center rounded-lg bg-primary/10 text-primary"><KeyRound className="size-7" /></span>
            {reset.stage === "request" && <>
              <h1 className="mt-5 text-3xl font-extrabold">نسيت كلمة المرور؟</h1>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">اكتب بريدك وهنبعت لك كود استعادة.</p>
              <form onSubmit={requestReset} className="mt-6 grid gap-4">
                <label className="grid gap-2 text-sm font-bold">البريد الإلكتروني
                  <Input name="resetEmail" required type="email" dir="ltr" autoComplete="email" defaultValue={reset.email} placeholder="email@example.com" />
                </label>
                <Button type="submit" size="lg" disabled={loading}>{loading ? <LoaderCircle className="animate-spin" /> : <MailCheck />} إرسال الكود</Button>
                <Button type="button" variant="link" onClick={closeReset} disabled={loading}>رجوع لتسجيل الدخول</Button>
              </form>
            </>}
            {reset.stage === "code" && <>
              <h1 className="mt-5 text-3xl font-extrabold">اكتب كود الاستعادة</h1>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">بعتنا الكود كاملًا إلى <span dir="ltr" className="font-semibold text-foreground">{reset.email}</span></p>
              <form onSubmit={verifyResetCode} className="mt-6 grid gap-4">
                <Input aria-label="كود الاستعادة" required inputMode="numeric" autoComplete="one-time-code" minLength={6} maxLength={10} dir="ltr" className="h-14 text-center text-2xl font-bold tracking-[0.35em]" value={resetCode} onChange={(event) => setResetCode(event.target.value.replace(/\D/g, "").slice(0, 10))} />
                <Button type="submit" size="lg" disabled={loading || resetCode.length < 6}>{loading ? <LoaderCircle className="animate-spin" /> : <CheckCircle2 />} تأكيد الكود</Button>
                <Button type="button" variant="ghost" onClick={resendResetCode} disabled={loading}>إعادة إرسال الكود</Button>
                <Button type="button" variant="link" onClick={closeReset} disabled={loading}>إلغاء</Button>
              </form>
            </>}
            {reset.stage === "choice" && <>
              <h1 className="mt-5 text-3xl font-extrabold">تم التحقق</h1>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">تحب تعمل إيه دلوقتي؟</p>
              <div className="mt-6 grid gap-3">
                <Button type="button" size="lg" onClick={enterAccount}><UserRound /> الدخول للحساب</Button>
                <Button type="button" size="lg" variant="outline" onClick={() => setReset({ stage: "password", email: reset.email })}><KeyRound /> تغيير كلمة المرور</Button>
              </div>
            </>}
            {reset.stage === "password" && <>
              <h1 className="mt-5 text-3xl font-extrabold">كلمة مرور جديدة</h1>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">اختار كلمة مرور 8 حروف على الأقل.</p>
              <form onSubmit={savePassword} className="mt-6 grid gap-4">
                <label className="grid gap-2 text-sm font-bold">كلمة المرور الجديدة<Input name="newPassword" required minLength={8} type="password" dir="ltr" autoComplete="new-password" /></label>
                <label className="grid gap-2 text-sm font-bold">تأكيد كلمة المرور<Input name="newPasswordConfirm" required minLength={8} type="password" dir="ltr" autoComplete="new-password" /></label>
                <Button type="submit" size="lg" disabled={loading}>{loading ? <LoaderCircle className="animate-spin" /> : <CheckCircle2 />} حفظ كلمة المرور</Button>
                <Button type="button" variant="link" onClick={enterAccount} disabled={loading}>تخطي والدخول للحساب</Button>
              </form>
            </>}
          </div> : confirmationEmail ? <div className="mt-8">
            <span className="grid size-14 place-items-center rounded-lg bg-primary/10 text-primary"><MailCheck className="size-7" /></span>
            <h1 className="mt-5 text-3xl font-extrabold">أكد بريدك</h1>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">اكتب كود التأكيد كاملًا زي ما وصلك في الرسالة إلى <span dir="ltr" className="font-semibold text-foreground">{confirmationEmail}</span></p>
            <form onSubmit={verifyCode} className="mt-6 grid gap-4">
              <Input aria-label="كود التأكيد" required inputMode="numeric" autoComplete="one-time-code" minLength={6} maxLength={10} dir="ltr" className="h-14 text-center text-2xl font-bold tracking-[0.35em]" value={confirmationCode} onChange={(event) => setConfirmationCode(event.target.value.replace(/\D/g, "").slice(0, 10))} />
              <Button type="submit" size="lg" disabled={loading || confirmationCode.length < 6}>{loading ? <LoaderCircle className="animate-spin" /> : <CheckCircle2 />} تأكيد الحساب</Button>
              <Button type="button" variant="ghost" onClick={resendCode} disabled={loading}>إعادة إرسال الكود</Button>
              <Button type="button" variant="link" onClick={() => { setConfirmationEmail(""); setConfirmationCode(""); }} disabled={loading}>تغيير البريد</Button>
            </form>
          </div> : <>
          <h1 className="mt-6 text-center text-3xl font-bold md:text-start">{mode === "signin" ? "ادخل حسابك" : "اعمل حساب جديد"}</h1>
          <p className="mt-2 text-center text-sm text-muted-foreground md:text-start">لمتابعة الطلبات أو التقديم كتاجر جملة.</p>

          <div className="mt-6 grid grid-cols-2 rounded-lg bg-muted p-1" role="tablist" aria-label="نوع الدخول">
            <Button type="button" variant={mode === "signin" ? "secondary" : "ghost"} onClick={() => setMode("signin")}>دخول</Button>
            <Button type="button" variant={mode === "signup" ? "secondary" : "ghost"} onClick={() => setMode("signup")}>حساب جديد</Button>
          </div>

          <Button type="button" variant="outline" size="lg" className="mt-6 h-13 w-full justify-center border-2 bg-background text-base shadow-sm hover:border-primary" disabled={busy} onClick={google}>
            {googleLoading ? <LoaderCircle className="animate-spin" /> : <GoogleIcon />}
            المتابعة بجوجل
          </Button>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />أو بالبريد الإلكتروني<span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={submit} className="grid gap-4">
            {mode === "signup" && <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-bold">الاسم بالكامل<div className="relative"><UserRound className="absolute end-3 top-3 size-5 text-muted-foreground"/><Input className="pe-10" name="fullName" required minLength={2} maxLength={100} autoComplete="name" /></div></label>
              <label className="grid gap-2 text-sm font-bold">رقم الموبايل<div className="relative"><Phone className="absolute end-3 top-3 size-5 text-muted-foreground"/><Input className="pe-10" name="phone" required type="tel" dir="ltr" inputMode="numeric" pattern="01[0125][0-9]{8}" maxLength={11} autoComplete="tel" /></div></label>
            </div>}
            <label className="grid gap-2 text-sm font-bold">
              البريد الإلكتروني
              <Input name="email" required type="email" dir="ltr" autoComplete="email" placeholder="email@example.com" />
            </label>
            {mode === "signup" && <label className="grid gap-2 text-sm font-bold">تأكيد كلمة المرور<Input name="passwordConfirm" required minLength={8} type="password" dir="ltr" autoComplete="new-password" /></label>}
            <label className="grid gap-2 text-sm font-bold">
              كلمة المرور
              <Input name="password" required minLength={8} type="password" dir="ltr" autoComplete={mode === "signin" ? "current-password" : "new-password"} />
            </label>
            <Button type="submit" size="lg" disabled={busy}>
              {loading ? <LoaderCircle className="animate-spin" /> : mode === "signin" ? "تسجيل الدخول" : "إنشاء الحساب"}
            </Button>
            {mode === "signin" && <Button type="button" variant="link" className="justify-self-center" disabled={busy} onClick={() => { holdRedirect.current = true; setReset({ stage: "request", email: "" }); }}>نسيت كلمة المرور؟</Button>}
          </form>

          <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
            <Lock className="size-3.5" /> بياناتك محمية — والتسوق وإتمام الطلب لا يحتاجان إلى حساب.
          </p>
          </>}
        </div>
      </div>
    </div>
  );
}
