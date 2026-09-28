"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  Copy,
  Eye,
  EyeOff,
  FolderKanban,
  ImagePlus,
  Inbox,
  LayoutDashboard,
  Loader2,
  LogOut,
  Plus,
  Save,
  Settings,
  ShieldCheck,
  Star,
  Trash2,
  Upload,
} from "lucide-react";
import type { CmsProject, CmsService, PublicSiteSettings } from "@/lib/cms";
import { DEFAULT_SITE_SETTINGS, slugify } from "@/lib/cms";

type Tab = "dashboard" | "projects" | "services" | "enquiries" | "reviews" | "admins" | "settings";
type Access = "loading" | "signed-out" | "admin";

type AdminUser = {
  email: string;
  role: "owner" | "admin";
};

type Enquiry = {
  id: string;
  name: string;
  businessName: string;
  phone: string;
  projectType: string;
  budget: string;
  timeline: string;
  projectGoal: string;
  status: "new" | "contacted" | "qualified" | "in-progress" | "closed";
  createdAt: string;
};

type Review = {
  id: number;
  name: string;
  business: string;
  rating: number;
  message: string;
  createdAt: string;
  status: "pending" | "approved";
};

type AdminRecord = {
  email: string;
  createdAt: string;
};

const OWNER_EMAIL = "surajkirtaniya5@gmail.com";

const EMPTY_PROJECT: CmsProject = {
  slug: "",
  brand: "",
  title: "",
  description: "",
  category: "",
  detail: "",
  imageUrl: "",
  color: "#21110a",
  backword: "",
  scope: [],
  liveUrl: "",
  order: 1,
  visible: true,
  featured: false,
};

function Field({
  label,
  value,
  onChange,
  placeholder = "",
  type = "text",
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "number" | "url" | "color" | "email" | "password";
}) {
  return (
    <label className="grid gap-2 text-[10px] uppercase tracking-[0.14em] text-[#8f7d72]">
      {label}
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 min-w-0 rounded-xl border border-white/10 bg-[#0d0603] px-3 text-sm normal-case tracking-normal text-[#f4e9e1] outline-none transition focus:border-[#f47b38]/60 focus:ring-2 focus:ring-[#f47b38]/10"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder = "",
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <label className="grid gap-2 text-[10px] uppercase tracking-[0.14em] text-[#8f7d72]">
      {label}
      <textarea
        value={value}
        rows={rows}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="resize-y rounded-xl border border-white/10 bg-[#0d0603] px-3 py-3 text-sm normal-case leading-6 tracking-normal text-[#f4e9e1] outline-none transition focus:border-[#f47b38]/60 focus:ring-2 focus:ring-[#f47b38]/10"
      />
    </label>
  );
}

async function optimizedImage(file: File) {
  if (!file.type.startsWith("image/")) throw new Error("Choose an image file.");
  if (file.size > 18 * 1024 * 1024) throw new Error("Image is too large. Keep it below 18 MB.");

  try {
    const bitmap = await createImageBitmap(file);
    const maxWidth = 1800;
    const scale = Math.min(1, maxWidth / bitmap.width);
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Image processor unavailable.");
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", 0.84)
    );
    if (!blob) throw new Error("Unable to optimize image.");
    if (blob.size > 7.5 * 1024 * 1024) throw new Error("Optimized image is still too large.");
    return new File([blob], `${slugify(file.name.replace(/\.[^.]+$/, "")) || "project"}.webp`, {
      type: "image/webp",
    });
  } catch (error) {
    if (file.size <= 7.5 * 1024 * 1024) return file;
    throw error;
  }
}

function imageForProject(project: CmsProject) {
  if (project.imageFileId && (project.docId || project.slug)) {
    return `/api/cms-image/${encodeURIComponent(String(project.docId || project.slug))}`;
  }
  return project.imageUrl || "";
}

export default function AdminAppV2() {
  const [access, setAccess] = useState<Access>("loading");
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loginEmail, setLoginEmail] = useState(OWNER_EMAIL);
  const [loginPassword, setLoginPassword] = useState("");
  const [tab, setTab] = useState<Tab>("dashboard");
  const [projects, setProjects] = useState<CmsProject[]>([]);
  const [services, setServices] = useState<CmsService[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [settingsData, setSettingsData] = useState<PublicSiteSettings>(DEFAULT_SITE_SETTINGS);
  const [pendingReviews, setPendingReviews] = useState<Review[]>([]);
  const [approvedReviews, setApprovedReviews] = useState<Review[]>([]);
  const [admins, setAdmins] = useState<AdminRecord[]>([]);
  const [selectedProject, setSelectedProject] = useState<CmsProject | null>(null);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [generatedPassword, setGeneratedPassword] = useState<{ email: string; password: string } | null>(null);
  const [currentOwnerPassword, setCurrentOwnerPassword] = useState("");
  const [nextOwnerPassword, setNextOwnerPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const isOwner = user?.role === "owner";

  const applyCms = (data: any) => {
    if (Array.isArray(data?.projects)) setProjects(data.projects);
    if (Array.isArray(data?.services)) setServices(data.services);
    if (Array.isArray(data?.enquiries)) setEnquiries(data.enquiries);
    if (data?.settings) setSettingsData({ ...DEFAULT_SITE_SETTINGS, ...data.settings });
  };

  const loadReviews = async () => {
    const response = await fetch("/api/admin/reviews", { cache: "no-store" });
    if (!response.ok) return;
    const data = await response.json();
    setPendingReviews(Array.isArray(data.pending) ? data.pending : []);
    setApprovedReviews(Array.isArray(data.approved) ? data.approved : []);
  };

  const loadAdmins = async () => {
    if (!isOwner) {
      setAdmins([]);
      return;
    }
    const response = await fetch("/api/admin/admins", { cache: "no-store" });
    if (!response.ok) return;
    const data = await response.json();
    setAdmins(Array.isArray(data.admins) ? data.admins : []);
  };

  const loadCms = async () => {
    const response = await fetch("/api/admin/cms", { cache: "no-store" });
    if (response.status === 401) {
      setAccess("signed-out");
      setUser(null);
      return;
    }
    if (!response.ok) throw new Error("Unable to load admin data.");
    const data = await response.json();
    applyCms(data);
    if (data.user) setUser(data.user);
  };

  const loadAll = async () => {
    setBusy(true);
    try {
      await loadCms();
      await Promise.all([loadReviews(), loadAdmins()]);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to load admin data.");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/session", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return null;
        return response.json();
      })
      .then((data) => {
        if (cancelled) return;
        if (data?.authenticated && data.user) {
          setUser(data.user);
          setAccess("admin");
        } else {
          setAccess("signed-out");
        }
      })
      .catch(() => !cancelled && setAccess("signed-out"));
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (access === "admin") void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [access, user?.role]);

  const login = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setNotice(null);
    try {
      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success) throw new Error(data?.error || "Unable to sign in.");
      setUser(data.user);
      setLoginPassword("");
      setAccess("admin");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    await fetch("/api/admin/session", { method: "DELETE" }).catch(() => {});
    setUser(null);
    setAccess("signed-out");
    setTab("dashboard");
  };

  const cmsAction = async (action: string, payload: Record<string, unknown> = {}) => {
    const response = await fetch("/api/admin/cms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...payload }),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.success) throw new Error(data?.error || "Update failed.");
    applyCms(data);
    return data;
  };

  const uploadImage = async (file: File) => {
    const optimized = await optimizedImage(file);
    const form = new FormData();
    form.set("image", optimized);
    const response = await fetch("/api/admin/upload", { method: "POST", body: form });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.imageFileId) throw new Error(data?.error || "Image upload failed.");
    return String(data.imageFileId);
  };

  const saveProject = async (project: CmsProject, imageFile?: File | null) => {
    setBusy(true);
    setNotice(null);
    try {
      let next = { ...project };
      if (!next.title.trim()) throw new Error("Project title is required.");
      if (!next.slug.trim()) next.slug = slugify(next.title);
      if (imageFile) {
        next.imageFileId = await uploadImage(imageFile);
        next.imageUrl = "";
      }
      if (!next.imageFileId && !next.imageUrl) throw new Error("Add a project image.");
      await cmsAction("saveProject", { project: next });
      setSelectedProject(null);
      setNotice("Project saved successfully.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to save project.");
    } finally {
      setBusy(false);
    }
  };

  const deleteProject = async (project: CmsProject) => {
    if (!project.docId || !window.confirm(`Delete “${project.title}”? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await cmsAction("deleteProject", { id: project.docId });
      setSelectedProject(null);
      setNotice("Project deleted.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to delete project.");
    } finally {
      setBusy(false);
    }
  };

  const duplicateProject = async (project: CmsProject) => {
    if (!project.docId) return;
    setBusy(true);
    try {
      await cmsAction("duplicateProject", { id: project.docId });
      setNotice("Project duplicated.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to duplicate project.");
    } finally {
      setBusy(false);
    }
  };

  const saveService = async (service: CmsService) => {
    setBusy(true);
    try {
      await cmsAction("saveService", { service });
      setNotice("Service saved.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to save service.");
    } finally {
      setBusy(false);
    }
  };

  const deleteService = async (service: CmsService) => {
    if (!service.docId || !window.confirm(`Delete “${service.title}”? `)) return;
    setBusy(true);
    try {
      await cmsAction("deleteService", { id: service.docId });
      setNotice("Service deleted.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to delete service.");
    } finally {
      setBusy(false);
    }
  };

  const saveSettings = async () => {
    setBusy(true);
    try {
      await cmsAction("saveSettings", { settings: settingsData });
      setNotice("Site settings saved.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to save settings.");
    } finally {
      setBusy(false);
    }
  };

  const setEnquiryStatus = async (id: string, status: Enquiry["status"]) => {
    try {
      await cmsAction("updateEnquiryStatus", { id, status });
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to update enquiry.");
    }
  };

  const deleteEnquiry = async (id: string) => {
    if (!window.confirm("Delete this enquiry from the admin archive?")) return;
    try {
      await cmsAction("deleteEnquiry", { id });
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to delete enquiry.");
    }
  };

  const moderateReview = async (id: number, action: "approve" | "reject" | "delete") => {
    setBusy(true);
    try {
      const response = await fetch("/api/admin/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success) throw new Error(data?.error || "Moderation failed.");
      setPendingReviews(data.pending || []);
      setApprovedReviews(data.approved || []);
      setNotice(action === "approve" ? "Review published." : "Review removed.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Moderation failed.");
    } finally {
      setBusy(false);
    }
  };

  const addAdmin = async () => {
    if (!isOwner) return;
    setBusy(true);
    setGeneratedPassword(null);
    try {
      const response = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newAdminEmail }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success) throw new Error(data?.error || "Unable to add admin.");
      setGeneratedPassword({ email: data.email, password: data.temporaryPassword });
      setNewAdminEmail("");
      await loadAdmins();
      setNotice("Admin added. Copy the temporary password and share it privately.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to add admin.");
    } finally {
      setBusy(false);
    }
  };

  const resetAdminPassword = async (email: string) => {
    setBusy(true);
    try {
      const response = await fetch("/api/admin/admins", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success) throw new Error(data?.error || "Unable to reset password.");
      setGeneratedPassword({ email: data.email, password: data.temporaryPassword });
      setNotice("New temporary password generated.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to reset password.");
    } finally {
      setBusy(false);
    }
  };

  const removeAdmin = async (email: string) => {
    if (!window.confirm(`Remove admin access for ${email}?`)) return;
    setBusy(true);
    try {
      const response = await fetch("/api/admin/admins", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success) throw new Error(data?.error || "Unable to remove admin.");
      await loadAdmins();
      setNotice("Admin access removed.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to remove admin.");
    } finally {
      setBusy(false);
    }
  };

  const changeOwnerPassword = async () => {
    if (nextOwnerPassword.length < 14) {
      setNotice("New password must be at least 14 characters.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "changeOwnerPassword",
          currentPassword: currentOwnerPassword,
          nextPassword: nextOwnerPassword,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success) throw new Error(data?.error || "Unable to change password.");
      setCurrentOwnerPassword("");
      setNextOwnerPassword("");
      setNotice("Owner password changed.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to change password.");
    } finally {
      setBusy(false);
    }
  };

  const stats = useMemo(
    () => ({
      projects: projects.length,
      visibleProjects: projects.filter((item) => item.visible !== false).length,
      services: services.filter((item) => item.visible !== false).length,
      enquiries: enquiries.length,
      pendingReviews: pendingReviews.length,
    }),
    [projects, services, enquiries, pendingReviews]
  );

  if (access === "loading") {
    return (
      <main className="min-h-screen bg-[#090402] text-[#f4e9e1] grid place-items-center">
        <Loader2 className="animate-spin text-[#f47b38]" />
      </main>
    );
  }

  if (access === "signed-out") {
    return (
      <main className="min-h-screen bg-[#090402] text-[#f4e9e1] px-5 grid place-items-center">
        <form onSubmit={login} className="w-full max-w-md rounded-[28px] border border-white/10 bg-[#130905] p-6 sm:p-7 shadow-2xl">
          <div className="h-11 w-11 grid place-items-center rounded-2xl border border-[#f47b38]/25 bg-[#f47b38]/[.08] text-[#f47b38]">
            <ShieldCheck size={20} />
          </div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#f47b38] mt-6">SURAJ.WEB Admin</p>
          <h1 className="font-['Antonio',sans-serif] text-5xl font-thin leading-none mt-3">Secure control panel.</h1>
          <p className="text-sm leading-6 text-[#a99689] mt-4">
            Sign in with an approved admin email and password. Knowing the /admin URL alone gives no access.
          </p>
          <div className="grid gap-4 mt-7">
            <Field label="Email" type="email" value={loginEmail} onChange={setLoginEmail} placeholder="you@gmail.com" />
            <Field label="Password" type="password" value={loginPassword} onChange={setLoginPassword} placeholder="Admin password" />
          </div>
          <button disabled={busy} className="mt-6 h-12 w-full rounded-full bg-[#f47b38] font-medium text-white shadow-[0_0_28px_rgba(244,123,56,.2)] disabled:opacity-60">
            {busy ? "Signing in..." : "Sign in"}
          </button>
          {notice && <p className="mt-4 text-xs leading-5 text-[#d99572]">{notice}</p>}
          <a href="/" className="mt-6 inline-flex items-center gap-2 text-xs text-[#9d887c]"><ArrowLeft size={14}/> Back to portfolio</a>
        </form>
      </main>
    );
  }

  const tabs: Array<[Tab, string, React.ReactNode]> = [
    ["dashboard", "Dashboard", <LayoutDashboard size={17} key="d" />],
    ["projects", "Projects", <FolderKanban size={17} key="p" />],
    ["services", "Services", <ArrowUpRight size={17} key="s" />],
    ["enquiries", "Enquiries", <Inbox size={17} key="e" />],
    ["reviews", "Reviews", <Star size={17} key="r" />],
    ...(isOwner ? [["admins", "Admins", <ShieldCheck size={17} key="a" />] as [Tab, string, React.ReactNode]] : []),
    ["settings", "Settings", <Settings size={17} key="st" />],
  ];

  return (
    <main className="min-h-screen bg-[#090402] text-[#f4e9e1]">
      <div className="mx-auto flex min-h-screen max-w-[1500px]">
        <aside className="hidden lg:flex w-[250px] shrink-0 flex-col border-r border-white/10 p-5 sticky top-0 h-screen">
          <a href="/" className="font-['Antonio',sans-serif] text-3xl">SURAJ.WEB</a>
          <p className="mt-1 text-[10px] uppercase tracking-[.18em] text-[#79685e]">Admin Console</p>
          <nav className="mt-8 grid gap-2">
            {tabs.map(([id, label, icon]) => (
              <button key={id} onClick={() => setTab(id)} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${tab === id ? "bg-[#f47b38] text-white" : "text-[#9f8d82] hover:bg-white/5 hover:text-white"}`}>
                {icon}{label}
              </button>
            ))}
          </nav>
          <div className="mt-auto border-t border-white/10 pt-5">
            <p className="truncate text-xs text-[#8d7b70]">{user?.email}</p>
            <p className="text-[10px] uppercase tracking-[.12em] text-[#f47b38] mt-1">{user?.role}</p>
            <button onClick={() => void logout()} className="mt-3 flex items-center gap-2 text-xs text-[#c0ada0]"><LogOut size={14}/> Sign out</button>
          </div>
        </aside>

        <section className="min-w-0 flex-1 px-4 py-5 sm:px-7 lg:px-9 lg:py-8">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[.2em] text-[#f47b38]">SURAJ.WEB</p>
              <h1 className="font-['Antonio',sans-serif] text-4xl sm:text-5xl font-thin mt-1">{tabs.find(([id]) => id === tab)?.[1]}</h1>
            </div>
            <div className="flex items-center gap-2">
              <a href="/" target="_blank" className="inline-flex h-10 items-center gap-2 rounded-full border border-white/10 px-4 text-xs text-[#d7c7bc]">View site <ArrowUpRight size={13}/></a>
              <button onClick={() => void loadAll()} className="h-10 rounded-full border border-white/10 px-4 text-xs">Refresh</button>
            </div>
          </header>

          <div className="lg:hidden mt-5 flex gap-2 overflow-x-auto pb-2">
            {tabs.map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)} className={`shrink-0 rounded-full px-4 py-2 text-xs ${tab === id ? "bg-[#f47b38] text-white" : "border border-white/10 text-[#a99386]"}`}>{label}</button>
            ))}
          </div>

          {notice && <div className="mt-5 rounded-xl border border-[#f47b38]/25 bg-[#f47b38]/[.06] px-4 py-3 text-xs leading-5 text-[#e6b294]">{notice}</div>}
          {busy && <div className="mt-4 flex items-center gap-2 text-xs text-[#9c897e]"><Loader2 size={14} className="animate-spin"/> Working…</div>}

          {tab === "dashboard" && (
            <div className="mt-7">
              <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
                {[
                  ["Projects", stats.projects, <FolderKanban size={17} key="p"/>],
                  ["Visible", stats.visibleProjects, <Eye size={17} key="v"/>],
                  ["Services", stats.services, <ArrowUpRight size={17} key="s"/>],
                  ["Enquiries", stats.enquiries, <Inbox size={17} key="e"/>],
                  ["Pending reviews", stats.pendingReviews, <Star size={17} key="r"/>],
                ].map(([label, value, icon]) => (
                  <article key={String(label)} className="rounded-2xl border border-white/10 bg-[#120805] p-4 sm:p-5">
                    <div className="flex items-center justify-between text-[#9c887c]">{icon}<span className="text-[9px] uppercase tracking-[.12em]">{label}</span></div>
                    <strong className="font-['Antonio',sans-serif] text-4xl font-thin block mt-7">{String(value)}</strong>
                  </article>
                ))}
              </div>
              <div className="mt-5 rounded-2xl border border-white/10 bg-[#120805] p-5 sm:p-6">
                <p className="text-[10px] uppercase tracking-[.16em] text-[#f47b38]">CMS ready</p>
                <h2 className="font-['Antonio',sans-serif] text-3xl mt-2">Everything important is editable here.</h2>
                <p className="text-sm leading-6 text-[#927f73] mt-3 max-w-2xl">
                  Add unlimited portfolio projects, upload screenshots from your phone gallery, change live links and case-study copy, manage services, moderate reviews, track enquiries, and control admin access.
                </p>
              </div>
            </div>
          )}

          {tab === "projects" && (
            <div className="mt-7 grid xl:grid-cols-[360px_1fr] gap-4">
              <section className="rounded-2xl border border-white/10 bg-[#120805] p-3 sm:p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="font-['Antonio',sans-serif] text-2xl">All Projects</h2>
                    <p className="text-[10px] text-[#79685e] mt-1">{projects.length} total · no fixed 4-card limit</p>
                  </div>
                  <button onClick={() => setSelectedProject({ ...EMPTY_PROJECT, order: projects.length + 1 })} className="inline-flex items-center gap-1 rounded-full bg-[#f47b38] px-3 py-2 text-xs"><Plus size={14}/> Add</button>
                </div>
                <div className="mt-4 grid gap-2">
                  {projects.map((project) => (
                    <button key={project.docId || project.slug} onClick={() => setSelectedProject({ ...project })} className={`grid grid-cols-[58px_1fr_auto] items-center gap-3 rounded-xl border p-2 text-left transition ${selectedProject?.docId === project.docId ? "border-[#f47b38]/50 bg-[#f47b38]/[.06]" : "border-white/8 bg-black/10 hover:border-white/15"}`}>
                      <div className="h-12 overflow-hidden rounded-lg bg-black/30">
                        {imageForProject(project) ? <img src={imageForProject(project)} alt="" className="h-full w-full object-cover"/> : <div className="h-full grid place-items-center"><ImagePlus size={16}/></div>}
                      </div>
                      <div className="min-w-0">
                        <strong className="block truncate text-sm">{project.title}</strong>
                        <span className="block truncate text-[10px] text-[#806f64]">{project.category || "No category"}</span>
                      </div>
                      {project.visible !== false ? <Eye size={15} className="text-[#f47b38]"/> : <EyeOff size={15} className="text-[#6d5d54]"/>}
                    </button>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-white/10 bg-[#120805] p-4 sm:p-6">
                {selectedProject ? (
                  <ProjectEditor
                    key={selectedProject.docId || "new-project"}
                    project={selectedProject}
                    busy={busy}
                    onChange={setSelectedProject}
                    onSave={saveProject}
                    onDelete={deleteProject}
                    onDuplicate={duplicateProject}
                  />
                ) : (
                  <div className="min-h-[420px] grid place-items-center text-center">
                    <div><FolderKanban className="mx-auto text-[#6d5a4f]"/><p className="mt-3 text-sm text-[#8f7d72]">Choose a project or add a new one.</p></div>
                  </div>
                )}
              </section>
            </div>
          )}

          {tab === "services" && (
            <div className="mt-7 grid gap-3">
              <div className="flex flex-wrap justify-between gap-3">
                <p className="text-sm text-[#968378]">Add, edit, hide or delete services. There is no fixed limit.</p>
                <button onClick={() => setServices((current) => [...current, { title:"", description:"", order: current.length + 1, visible:true }])} className="inline-flex items-center gap-2 rounded-full bg-[#f47b38] px-4 py-2 text-xs"><Plus size={14}/> Add service</button>
              </div>
              {services.map((service, index) => (
                <article key={service.docId || `new-${index}`} className="rounded-2xl border border-white/10 bg-[#120805] p-4">
                  <div className="grid lg:grid-cols-[1fr_1.6fr_90px_auto] gap-3 items-end">
                    <Field label="Service" value={service.title} onChange={(value) => setServices((all) => all.map((item, i) => i === index ? {...item,title:value}:item))}/>
                    <Field label="Description" value={service.description} onChange={(value) => setServices((all) => all.map((item, i) => i === index ? {...item,description:value}:item))}/>
                    <Field label="Order" type="number" value={service.order} onChange={(value) => setServices((all) => all.map((item, i) => i === index ? {...item,order:Number(value)}:item))}/>
                    <div className="flex gap-2">
                      <button onClick={() => setServices((all) => all.map((item, i) => i === index ? {...item,visible:!item.visible}:item))} className="h-11 w-11 grid place-items-center rounded-xl border border-white/10">{service.visible !== false?<Eye size={16}/>:<EyeOff size={16}/>}</button>
                      <button onClick={() => void saveService(service)} className="h-11 w-11 grid place-items-center rounded-xl bg-[#f47b38]"><Save size={16}/></button>
                      {service.docId && <button onClick={() => void deleteService(service)} className="h-11 w-11 grid place-items-center rounded-xl border border-red-500/20 text-red-300"><Trash2 size={16}/></button>}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {tab === "enquiries" && (
            <div className="mt-7 grid gap-3">
              {enquiries.length ? enquiries.map((item) => (
                <article key={item.id} className="rounded-2xl border border-white/10 bg-[#120805] p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-base font-medium">{item.name || "Unnamed enquiry"}</h2>
                      <p className="text-xs text-[#8f7d72] mt-1">{item.businessName || "No business name"} · {item.phone || "No phone"}</p>
                    </div>
                    <div className="flex gap-2">
                      <select value={item.status || "new"} onChange={(event) => void setEnquiryStatus(item.id,event.target.value as Enquiry["status"])} className="rounded-full border border-white/10 bg-[#0d0603] px-3 py-2 text-xs">
                        {["new","contacted","qualified","in-progress","closed"].map((status)=><option value={status} key={status}>{status}</option>)}
                      </select>
                      <button onClick={() => void deleteEnquiry(item.id)} className="h-9 w-9 grid place-items-center rounded-full border border-red-500/20 text-red-300"><Trash2 size={14}/></button>
                    </div>
                  </div>
                  <div className="mt-4 grid sm:grid-cols-3 gap-3 text-xs">
                    <div><span className="text-[#75655c]">Project</span><p className="mt-1">{item.projectType || "—"}</p></div>
                    <div><span className="text-[#75655c]">Budget</span><p className="mt-1">{item.budget || "—"}</p></div>
                    <div><span className="text-[#75655c]">Timeline</span><p className="mt-1">{item.timeline || "—"}</p></div>
                  </div>
                  {item.projectGoal && <p className="mt-4 border-t border-white/8 pt-4 text-sm leading-6 text-[#b7a79d]">{item.projectGoal}</p>}
                </article>
              )) : <div className="rounded-2xl border border-dashed border-white/10 p-8 text-sm text-[#8f7d72]">New website enquiries will appear here automatically.</div>}
            </div>
          )}

          {tab === "reviews" && (
            <div className="mt-7 grid gap-7">
              <section>
                <div className="flex items-end justify-between gap-3">
                  <div><p className="text-[10px] uppercase tracking-[.16em] text-[#f47b38]">Needs action</p><h2 className="font-['Antonio',sans-serif] text-3xl mt-1">Pending Reviews</h2></div>
                  <span className="text-xs text-[#7d6b61]">{pendingReviews.length}</span>
                </div>
                <div className="grid md:grid-cols-2 gap-3 mt-4">
                  {pendingReviews.length ? pendingReviews.map((review) => (
                    <article key={review.id} className="rounded-2xl border border-[#f47b38]/20 bg-[#120805] p-5">
                      <div className="flex justify-between gap-3"><strong>{review.name}</strong><span className="text-[#f47b38]">{review.rating}/5 ★</span></div>
                      <p className="text-xs text-[#806f64] mt-1">{review.business || "Portfolio visitor"}</p>
                      <p className="text-sm leading-6 text-[#bdada2] mt-4">{review.message}</p>
                      <div className="flex gap-2 mt-5">
                        <button onClick={() => void moderateReview(review.id,"approve")} className="rounded-full bg-[#f47b38] px-4 py-2 text-xs">Approve</button>
                        <button onClick={() => void moderateReview(review.id,"reject")} className="rounded-full border border-red-500/20 px-4 py-2 text-xs text-red-300">Reject</button>
                      </div>
                    </article>
                  )) : <p className="text-sm text-[#806f64]">No pending reviews.</p>}
                </div>
              </section>

              <section>
                <p className="text-[10px] uppercase tracking-[.16em] text-[#75655c]">Published</p>
                <h2 className="font-['Antonio',sans-serif] text-3xl mt-1">Live Reviews</h2>
                <div className="grid md:grid-cols-2 gap-3 mt-4">
                  {approvedReviews.map((review) => (
                    <article key={review.id} className="rounded-2xl border border-white/10 bg-[#120805] p-5">
                      <div className="flex justify-between gap-3"><strong>{review.name}</strong><span className="text-[#f47b38]">{review.rating}/5 ★</span></div>
                      <p className="text-sm leading-6 text-[#bdada2] mt-4">{review.message}</p>
                      <button onClick={() => void moderateReview(review.id,"delete")} className="mt-4 inline-flex items-center gap-2 text-xs text-red-300"><Trash2 size={13}/> Delete</button>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          )}

          {tab === "admins" && isOwner && (
            <div className="mt-7 max-w-3xl grid gap-4">
              <section className="rounded-2xl border border-white/10 bg-[#120805] p-5 sm:p-6">
                <p className="text-[10px] uppercase tracking-[.16em] text-[#f47b38]">Owner controls</p>
                <h2 className="font-['Antonio',sans-serif] text-3xl mt-2">Admin access</h2>
                <p className="text-sm leading-6 text-[#968378] mt-2">Just add an email. A strong temporary password is generated automatically. No Firebase UID or console setup is required.</p>

                <div className="mt-5 flex flex-col sm:flex-row gap-2">
                  <input type="email" value={newAdminEmail} onChange={(event)=>setNewAdminEmail(event.target.value)} placeholder="newadmin@gmail.com" className="h-12 flex-1 rounded-xl border border-white/10 bg-[#0d0603] px-4 text-sm outline-none focus:border-[#f47b38]/60"/>
                  <button onClick={() => void addAdmin()} className="h-12 rounded-xl bg-[#f47b38] px-5 text-sm inline-flex items-center justify-center gap-2"><Plus size={16}/> Add Admin</button>
                </div>

                {generatedPassword && (
                  <div className="mt-4 rounded-xl border border-[#f47b38]/30 bg-[#f47b38]/[.08] p-4">
                    <p className="text-xs text-[#f1b28d]">Copy this password now. It is shown only after creation/reset.</p>
                    <p className="font-mono text-sm break-all mt-2">{generatedPassword.email}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <code className="min-w-0 flex-1 break-all rounded-lg bg-black/25 p-3 text-sm">{generatedPassword.password}</code>
                      <button onClick={() => navigator.clipboard.writeText(generatedPassword.password)} className="h-10 w-10 shrink-0 grid place-items-center rounded-lg border border-white/10"><Copy size={15}/></button>
                    </div>
                  </div>
                )}

                <div className="mt-6 grid gap-2">
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-[#f47b38]/25 bg-[#f47b38]/[.06] p-4">
                    <div><strong className="text-sm">{OWNER_EMAIL}</strong><p className="text-[10px] uppercase tracking-[.12em] text-[#f47b38] mt-1">Owner · cannot be removed</p></div>
                    <ShieldCheck size={18} className="text-[#f47b38]"/>
                  </div>
                  {admins.map((admin) => (
                    <div key={admin.email} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 p-4">
                      <div><strong className="text-sm">{admin.email}</strong><p className="text-[10px] uppercase tracking-[.12em] text-[#77665d] mt-1">Admin</p></div>
                      <div className="flex gap-2">
                        <button onClick={() => void resetAdminPassword(admin.email)} className="rounded-full border border-white/10 px-3 py-2 text-xs">Reset password</button>
                        <button onClick={() => void removeAdmin(admin.email)} className="rounded-full border border-red-500/20 px-3 py-2 text-xs text-red-300">Remove</button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-white/10 bg-[#120805] p-5 sm:p-6">
                <p className="text-[10px] uppercase tracking-[.16em] text-[#75655c]">Security</p>
                <h2 className="font-['Antonio',sans-serif] text-2xl mt-2">Change owner password</h2>
                <div className="grid sm:grid-cols-2 gap-3 mt-5">
                  <Field label="Current password" type="password" value={currentOwnerPassword} onChange={setCurrentOwnerPassword}/>
                  <Field label="New password (14+ characters)" type="password" value={nextOwnerPassword} onChange={setNextOwnerPassword}/>
                </div>
                <button onClick={() => void changeOwnerPassword()} className="mt-4 rounded-full border border-[#f47b38]/35 px-5 py-2.5 text-xs text-[#f0b38f]">Change Password</button>
              </section>
            </div>
          )}

          {tab === "settings" && (
            <div className="mt-7 max-w-3xl rounded-2xl border border-white/10 bg-[#120805] p-5 sm:p-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="WhatsApp number" value={settingsData.whatsappNumber} onChange={(value)=>setSettingsData({...settingsData,whatsappNumber:value})}/>
                <Field label="Projects label" value={settingsData.projectSectionLabel} onChange={(value)=>setSettingsData({...settingsData,projectSectionLabel:value})}/>
                <TextArea label="Projects heading" value={settingsData.projectSectionHeading} onChange={(value)=>setSettingsData({...settingsData,projectSectionHeading:value})} rows={3}/>
                <Field label="Services label" value={settingsData.servicesSectionLabel} onChange={(value)=>setSettingsData({...settingsData,servicesSectionLabel:value})}/>
                <TextArea label="Services heading" value={settingsData.servicesSectionHeading} onChange={(value)=>setSettingsData({...settingsData,servicesSectionHeading:value})} rows={3}/>
              </div>
              <button onClick={() => void saveSettings()} className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#f47b38] px-5 py-3 text-xs"><Save size={15}/> Save settings</button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function ProjectEditor({
  project,
  busy,
  onChange,
  onSave,
  onDelete,
  onDuplicate,
}: {
  project: CmsProject;
  busy: boolean;
  onChange: (project: CmsProject) => void;
  onSave: (project: CmsProject, imageFile?: File | null) => Promise<void>;
  onDelete: (project: CmsProject) => Promise<void>;
  onDuplicate: (project: CmsProject) => Promise<void>;
}) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState(imageForProject(project));

  useEffect(() => {
    if (!imageFile) {
      setPreview(imageForProject(project));
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile, project]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[.18em] text-[#f47b38]">{project.docId ? "Edit project" : "New project"}</p>
          <h2 className="font-['Antonio',sans-serif] text-3xl mt-1">{project.title || "Untitled Project"}</h2>
        </div>
        <div className="flex gap-2">
          {project.docId && <button onClick={() => void onDuplicate(project)} className="h-10 px-3 rounded-full border border-white/10 text-xs inline-flex items-center gap-2"><Copy size={14}/> Duplicate</button>}
          {project.docId && <button onClick={() => void onDelete(project)} className="h-10 px-3 rounded-full border border-red-500/20 text-red-300 text-xs inline-flex items-center gap-2"><Trash2 size={14}/> Delete</button>}
        </div>
      </div>

      <div className="mt-5 grid lg:grid-cols-[.85fr_1.15fr] gap-5">
        <div>
          <label className="block cursor-pointer overflow-hidden rounded-2xl border border-dashed border-[#f47b38]/30 bg-black/20">
            <div className="aspect-[16/10] overflow-hidden">
              {preview ? <img src={preview} alt="" className="h-full w-full object-cover"/> : <div className="h-full grid place-items-center text-[#7f6b60]"><ImagePlus size={30}/></div>}
            </div>
            <div className="flex items-center justify-center gap-2 border-t border-white/8 py-3 text-xs text-[#d6b29e]"><Upload size={14}/> Upload from gallery</div>
            <input type="file" accept="image/*" className="sr-only" onChange={(event)=>setImageFile(event.target.files?.[0] || null)}/>
          </label>
          <div className="mt-3"><Field label="Or direct image URL" type="url" value={project.imageFileId ? "" : project.imageUrl} onChange={(value)=>onChange({...project,imageUrl:value,imageFileId:undefined})} placeholder="https://..."/></div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Field label="Order" type="number" value={project.order} onChange={(value)=>onChange({...project,order:Number(value)})}/>
            <Field label="Card color" type="color" value={project.color} onChange={(value)=>onChange({...project,color:value})}/>
          </div>
          <div className="mt-4 flex gap-3">
            <button onClick={()=>onChange({...project,visible:!project.visible})} className={`flex-1 rounded-xl border px-3 py-3 text-xs ${project.visible !== false?"border-[#f47b38]/35 bg-[#f47b38]/[.06]":"border-white/10"}`}>{project.visible !== false?"Visible":"Hidden"}</button>
            <button onClick={()=>onChange({...project,featured:!project.featured})} className={`flex-1 rounded-xl border px-3 py-3 text-xs ${project.featured?"border-[#f47b38]/35 bg-[#f47b38]/[.06]":"border-white/10"}`}>{project.featured?"Featured":"Not featured"}</button>
          </div>
        </div>

        <div className="grid gap-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Title" value={project.title} onChange={(value)=>onChange({...project,title:value,slug:project.slug || slugify(value)})}/>
            <Field label="Slug" value={project.slug} onChange={(value)=>onChange({...project,slug:slugify(value)})}/>
            <Field label="Brand" value={project.brand} onChange={(value)=>onChange({...project,brand:value})}/>
            <Field label="Category" value={project.category} onChange={(value)=>onChange({...project,category:value})}/>
          </div>
          <TextArea label="Card description" value={project.description} onChange={(value)=>onChange({...project,description:value})} rows={3}/>
          <TextArea label="Case study detail" value={project.detail} onChange={(value)=>onChange({...project,detail:value})} rows={5}/>
          <Field label="Live preview URL" type="url" value={project.liveUrl} onChange={(value)=>onChange({...project,liveUrl:value})} placeholder="https://..."/>
          <Field label="Background word (optional)" value={project.backword} onChange={(value)=>onChange({...project,backword:value})}/>
          <TextArea label="Scope / features — one per line" value={project.scope.join("\n")} onChange={(value)=>onChange({...project,scope:value.split("\n")})} rows={5}/>
        </div>
      </div>

      <button disabled={busy} onClick={() => void onSave(project,imageFile)} className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#f47b38] px-6 py-3 text-sm font-medium text-white disabled:opacity-50">
        {busy?<Loader2 size={16} className="animate-spin"/>:<Check size={16}/>} Save project
      </button>
    </div>
  );
}
