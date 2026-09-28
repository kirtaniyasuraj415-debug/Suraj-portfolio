"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  BriefcaseBusiness,
  Check,
  Copy,
  ExternalLink,
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
  Star,
  Trash2,
  Upload,
} from "lucide-react";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import {
  DEFAULT_SERVICES,
  DEFAULT_SITE_SETTINGS,
  slugify,
  type CmsProject,
  type CmsService,
  type PublicSiteSettings,
} from "@/lib/cms";

type Tab = "dashboard" | "projects" | "services" | "enquiries" | "reviews" | "admins" | "settings";
type AccessState = "loading" | "signed-out" | "denied" | "admin";

type Enquiry = {
  id: string;
  name?: string;
  businessName?: string;
  phone?: string;
  projectType?: string;
  budget?: string;
  timeline?: string;
  projectGoal?: string;
  status?: string;
  createdAt?: string;
};

type Review = {
  id: number;
  name: string;
  business: string;
  rating: number;
  message: string;
  createdAt: string;
};

type AdminAccess = {
  email: string;
  role: "admin";
  addedAt?: unknown;
  addedBy?: string;
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
  type?: "text" | "number" | "url" | "color";
}) {
  return (
    <label className="grid gap-2 text-[11px] uppercase tracking-[0.12em] text-[#8f7d72]">
      {label}
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 rounded-xl border border-white/10 bg-[#0d0603] px-3 text-sm normal-case tracking-normal text-[#f4e9e1] outline-none transition focus:border-[#f47b38]/60 focus:ring-2 focus:ring-[#f47b38]/10"
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
    <label className="grid gap-2 text-[11px] uppercase tracking-[0.12em] text-[#8f7d72]">
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

async function compressImage(file: File) {
  if (!file.type.startsWith("image/")) throw new Error("Please select an image file.");
  if (file.size > 18 * 1024 * 1024) throw new Error("Image is too large. Keep it under 18 MB.");

  const toDataUrl = (blob: Blob) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Unable to read the image."));
      reader.readAsDataURL(blob);
    });

  try {
    const bitmap = await createImageBitmap(file);
    let width = Math.min(bitmap.width, 1400);
    let height = Math.round(bitmap.height * (width / bitmap.width));
    let quality = 0.82;
    let blob: Blob | null = null;

    for (let attempt = 0; attempt < 6; attempt += 1) {
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(width));
      canvas.height = Math.max(1, Math.round(height));
      const context = canvas.getContext("2d");
      if (!context) break;
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/webp", quality)
      );
      if (blob && blob.size <= 520 * 1024) break;
      width *= 0.86;
      height *= 0.86;
      quality = Math.max(0.56, quality - 0.07);
    }

    bitmap.close();
    if (!blob) throw new Error("Unable to optimize the image.");
    if (blob.size > 650 * 1024) {
      throw new Error("Image could not be compressed enough. Try a smaller screenshot.");
    }
    return toDataUrl(blob);
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error("Unable to process the image.");
  }
}

export default function AdminApp() {
  const [access, setAccess] = useState<AccessState>("loading");
  const [user, setUser] = useState<User | null>(null);
  const [tab, setTab] = useState<Tab>("dashboard");
  const [projects, setProjects] = useState<CmsProject[]>([]);
  const [services, setServices] = useState<CmsService[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [settingsData, setSettingsData] = useState<PublicSiteSettings>(DEFAULT_SITE_SETTINGS);
  const [admins, setAdmins] = useState<AdminAccess[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [selectedProject, setSelectedProject] = useState<CmsProject | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      if (!nextUser) {
        setAccess("signed-out");
        return;
      }

      const email = String(nextUser.email || "").trim().toLowerCase();
      if (!nextUser.emailVerified || !email) {
        setAccess("denied");
        return;
      }

      if (email === OWNER_EMAIL) {
        setAccess("admin");
        return;
      }

      try {
        const admin = await getDoc(doc(db, "adminEmails", email));
        setAccess(admin.exists() ? "admin" : "denied");
      } catch {
        setAccess("denied");
      }
    });
    return unsubscribe;
  }, []);

  const isOwner = String(user?.email || "").toLowerCase() === OWNER_EMAIL;

  const loadData = async () => {
    if (access !== "admin") return;
    setBusy(true);
    try {
      const [projectSnap, serviceSnap, enquirySnap, settingsSnap] = await Promise.all([
        getDocs(query(collection(db, "portfolioProjects"), orderBy("order", "asc"))),
        getDocs(query(collection(db, "portfolioServices"), orderBy("order", "asc"))),
        getDocs(collection(db, "projectEnquiries")),
        getDoc(doc(db, "portfolioSettings", "public")),
      ]);

      setProjects(
        projectSnap.docs.map((item) => ({ docId: item.id, ...(item.data() as Omit<CmsProject, "docId">) }))
      );
      setServices(
        serviceSnap.docs.map((item) => ({ docId: item.id, ...(item.data() as Omit<CmsService, "docId">) }))
      );
      setEnquiries(
        enquirySnap.docs
          .map((item) => ({ id: item.id, ...(item.data() as Omit<Enquiry, "id">) }))
          .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")))
      );
      if (settingsSnap.exists()) {
        setSettingsData({ ...DEFAULT_SITE_SETTINGS, ...(settingsSnap.data() as Partial<PublicSiteSettings>) });
      }

      if (String(auth.currentUser?.email || "").toLowerCase() === OWNER_EMAIL) {
        const adminSnap = await getDocs(collection(db, "adminEmails"));
        setAdmins(
          adminSnap.docs
            .map((item) => ({ email: item.id, ...(item.data() as Omit<AdminAccess, "email">) }))
            .sort((a, b) => a.email.localeCompare(b.email))
        );
      } else {
        setAdmins([]);
      }

      fetch("/api/ratings", { cache: "no-store" })
        .then((response) => (response.ok ? response.json() : null))
        .then((data) => Array.isArray(data?.ratings) && setReviews(data.ratings))
        .catch(() => {});
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (access === "admin") void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [access]);

  const login = async () => {
    setNotice(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(auth, provider);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to sign in.");
    }
  };

  const seedProjects = async () => {
    setBusy(true);
    setNotice(null);
    try {
      const response = await fetch("/api/portfolio-projects", { cache: "no-store" });
      const data = await response.json();
      const existing = await getDocs(collection(db, "portfolioProjects"));
      if (!existing.empty) throw new Error("Projects collection is not empty.");

      for (const [index, project] of (data.projects || []).entries()) {
        await addDoc(collection(db, "portfolioProjects"), {
          slug: project.id,
          brand: project.brand,
          title: project.title,
          description: project.line,
          category: project.tag,
          detail: project.detail,
          imageUrl: project.image,
          color: project.color,
          backword: project.backword,
          scope: project.scope,
          liveUrl: project.liveUrl,
          order: index + 1,
          visible: true,
          featured: index < 4,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      setNotice("Current portfolio projects imported into the admin CMS.");
      await loadData();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Project import failed.");
    } finally {
      setBusy(false);
    }
  };

  const seedServices = async () => {
    setBusy(true);
    try {
      const existing = await getDocs(collection(db, "portfolioServices"));
      if (!existing.empty) throw new Error("Services collection is not empty.");
      for (const service of DEFAULT_SERVICES) {
        await addDoc(collection(db, "portfolioServices"), {
          ...service,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      setNotice("Default services imported.");
      await loadData();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Service import failed.");
    } finally {
      setBusy(false);
    }
  };

  const saveProject = async (draft: CmsProject, imageFile?: File | null) => {
    setBusy(true);
    setNotice(null);
    try {
      const title = draft.title.trim();
      if (!title) throw new Error("Project title is required.");
      const slug = slugify(draft.slug || title);
      if (!slug) throw new Error("Project slug is required.");

      let imageUrl = draft.imageUrl;
      if (imageFile) {
        imageUrl = await compressImage(imageFile);
      }
      if (!imageUrl) throw new Error("Add a project image.");

      const payload = {
        slug,
        brand: draft.brand.trim(),
        title,
        description: draft.description.trim(),
        category: draft.category.trim(),
        detail: draft.detail.trim(),
        imageUrl,
        imagePath: "",
        color: draft.color || "#21110a",
        backword: draft.backword.trim(),
        scope: draft.scope.map((item) => item.trim()).filter(Boolean).slice(0, 8),
        liveUrl: draft.liveUrl.trim(),
        order: Math.max(1, Number(draft.order) || projects.length + 1),
        visible: Boolean(draft.visible),
        featured: Boolean(draft.featured),
        updatedAt: serverTimestamp(),
      };

      if (draft.docId) {
        await setDoc(doc(db, "portfolioProjects", draft.docId), payload, { merge: true });
      } else {
        await addDoc(collection(db, "portfolioProjects"), { ...payload, createdAt: serverTimestamp() });
      }

      setSelectedProject(null);
      setNotice("Project saved.");
      await loadData();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to save project.");
    } finally {
      setBusy(false);
    }
  };

  const removeProject = async (project: CmsProject) => {
    if (!project.docId || !window.confirm(`Delete “${project.title}”? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await deleteDoc(doc(db, "portfolioProjects", project.docId));
      setSelectedProject(null);
      setNotice("Project deleted.");
      await loadData();
    } finally {
      setBusy(false);
    }
  };

  const duplicateProject = async (project: CmsProject) => {
    setBusy(true);
    try {
      const copy = { ...project };
      delete copy.docId;
      await addDoc(collection(db, "portfolioProjects"), {
        ...copy,
        slug: slugify(project.slug + "-copy-" + Date.now()),
        title: project.title + " Copy",
        order: projects.length + 1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setNotice("Project duplicated.");
      await loadData();
    } finally {
      setBusy(false);
    }
  };

  const saveService = async (service: CmsService) => {
    setBusy(true);
    try {
      const payload = {
        title: service.title.trim(),
        description: service.description.trim(),
        order: Math.max(1, Number(service.order) || 1),
        visible: Boolean(service.visible),
        updatedAt: serverTimestamp(),
      };
      if (!payload.title) throw new Error("Service title is required.");
      if (service.docId) {
        await setDoc(doc(db, "portfolioServices", service.docId), payload, { merge: true });
      } else {
        await addDoc(collection(db, "portfolioServices"), { ...payload, createdAt: serverTimestamp() });
      }
      setNotice("Service saved.");
      await loadData();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to save service.");
    } finally {
      setBusy(false);
    }
  };

  const deleteService = async (service: CmsService) => {
    if (!service.docId || !window.confirm(`Delete “${service.title}”? `)) return;
    await deleteDoc(doc(db, "portfolioServices", service.docId));
    setNotice("Service deleted.");
    await loadData();
  };

  const saveSettings = async () => {
    setBusy(true);
    try {
      await setDoc(doc(db, "portfolioSettings", "public"), {
        ...settingsData,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      setNotice("Site settings saved.");
    } finally {
      setBusy(false);
    }
  };

  const updateEnquiryStatus = async (id: string, status: string) => {
    await updateDoc(doc(db, "projectEnquiries", id), { status });
    await loadData();
  };

  const addAdmin = async () => {
    if (!isOwner) return;
    const email = newAdminEmail.trim().toLowerCase();
    if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) {
      setNotice("Enter a valid email address.");
      return;
    }
    if (email === OWNER_EMAIL) {
      setNotice("Owner email already has permanent access.");
      return;
    }
    setBusy(true);
    try {
      await setDoc(doc(db, "adminEmails", email), {
        email,
        role: "admin",
        addedAt: serverTimestamp(),
        addedBy: OWNER_EMAIL,
      });
      setNewAdminEmail("");
      setNotice(`${email} can now sign in as an admin with Google.`);
      await loadData();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to add admin.");
    } finally {
      setBusy(false);
    }
  };

  const removeAdmin = async (email: string) => {
    if (!isOwner || email === OWNER_EMAIL) return;
    if (!window.confirm(`Remove admin access for ${email}?`)) return;
    setBusy(true);
    try {
      await deleteDoc(doc(db, "adminEmails", email));
      setNotice(`${email} no longer has admin access.`);
      await loadData();
    } finally {
      setBusy(false);
    }
  };

  const stats = useMemo(() => ({
    projects: projects.length,
    visibleProjects: projects.filter((item) => item.visible).length,
    services: services.filter((item) => item.visible).length,
    enquiries: enquiries.length,
    reviews: reviews.length,
  }), [projects, services, enquiries, reviews]);

  if (access === "loading") {
    return <div className="min-h-screen bg-[#090402] text-[#f4e9e1] grid place-items-center"><Loader2 className="animate-spin text-[#f47b38]" /></div>;
  }

  if (access === "signed-out") {
    return (
      <main className="min-h-screen bg-[#090402] text-[#f4e9e1] px-5 grid place-items-center">
        <section className="w-full max-w-md rounded-[28px] border border-white/10 bg-[#130905] p-7 shadow-2xl">
          <p className="text-xs uppercase tracking-[0.2em] text-[#f47b38]">SURAJ.WEB Admin</p>
          <h1 className="font-['Antonio',sans-serif] text-5xl font-thin leading-none mt-4">Control your portfolio.</h1>
          <p className="text-sm leading-6 text-[#a99689] mt-4">Sign in with your approved Google email. The owner account is already locked to surajkirtaniya5@gmail.com.</p>
          <button onClick={login} className="mt-7 h-12 w-full rounded-full bg-[#f47b38] font-medium text-white shadow-[0_0_28px_rgba(244,123,56,.25)]">
            Continue with Google
          </button>
          {notice && <p className="mt-4 text-xs text-[#d99572]">{notice}</p>}
          <a href="/" className="mt-6 inline-flex items-center gap-2 text-xs text-[#9d887c]"><ArrowLeft size={14}/> Back to portfolio</a>
        </section>
      </main>
    );
  }

  if (access === "denied") {
    return (
      <main className="min-h-screen bg-[#090402] text-[#f4e9e1] px-5 grid place-items-center">
        <section className="w-full max-w-lg rounded-[28px] border border-[#f47b38]/25 bg-[#130905] p-7">
          <p className="text-xs uppercase tracking-[0.2em] text-[#f47b38]">Access denied</p>
          <h1 className="font-['Antonio',sans-serif] text-4xl mt-4">This email is not on the admin list.</h1>
          <p className="text-sm text-[#a99689] mt-4 leading-6">Signed in as <strong className="text-[#ead9ce]">{user?.email}</strong>. Ask the owner to add this email from Admin → Admins.</p>
          <button onClick={() => signOut(auth)} className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs"><LogOut size={14}/> Sign out</button>
        </section>
      </main>
    );
  }

  const tabs: Array<[Tab, string, React.ReactNode]> = [
    ["dashboard", "Dashboard", <LayoutDashboard size={17} key="d" />],
    ["projects", "Projects", <FolderKanban size={17} key="p" />],
    ["services", "Services", <BriefcaseBusiness size={17} key="s" />],
    ["enquiries", "Enquiries", <Inbox size={17} key="e" />],
    ["reviews", "Reviews", <Star size={17} key="r" />],
    ...(isOwner ? [["admins", "Admins", <Check size={17} key="a" />] as [Tab, string, React.ReactNode]] : []),
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
            <button onClick={() => signOut(auth)} className="mt-3 flex items-center gap-2 text-xs text-[#c0ada0]"><LogOut size={14}/> Sign out</button>
          </div>
        </aside>

        <section className="min-w-0 flex-1 px-4 py-5 sm:px-7 lg:px-9 lg:py-8">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[.2em] text-[#f47b38]">SURAJ.WEB</p>
              <h1 className="font-['Antonio',sans-serif] text-4xl sm:text-5xl font-thin mt-1">{tabs.find(([id]) => id === tab)?.[1]}</h1>
            </div>
            <div className="flex items-center gap-2">
              <a href="/" target="_blank" className="inline-flex h-10 items-center gap-2 rounded-full border border-white/10 px-4 text-xs text-[#d7c7bc]">View site <ExternalLink size={13}/></a>
              <button onClick={() => void loadData()} className="h-10 rounded-full border border-white/10 px-4 text-xs">Refresh</button>
            </div>
          </header>

          <div className="lg:hidden mt-5 flex gap-2 overflow-x-auto pb-2">
            {tabs.map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)} className={`shrink-0 rounded-full px-4 py-2 text-xs ${tab === id ? "bg-[#f47b38] text-white" : "border border-white/10 text-[#a99386]"}`}>{label}</button>
            ))}
          </div>

          {notice && <div className="mt-5 rounded-xl border border-[#f47b38]/25 bg-[#f47b38]/[.06] px-4 py-3 text-xs text-[#e6b294]">{notice}</div>}
          {busy && <div className="mt-4 flex items-center gap-2 text-xs text-[#9c897e]"><Loader2 size={14} className="animate-spin"/> Working…</div>}

          {tab === "dashboard" && (
            <div className="mt-7">
              <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
                {[
                  ["Projects", stats.projects, <FolderKanban size={17} key="p"/>],
                  ["Visible", stats.visibleProjects, <Eye size={17} key="v"/>],
                  ["Services", stats.services, <BriefcaseBusiness size={17} key="s"/>],
                  ["Enquiries", stats.enquiries, <Inbox size={17} key="e"/>],
                  ["Reviews", stats.reviews, <Star size={17} key="r"/>],
                ].map(([label, value, icon]) => (
                  <article key={String(label)} className="rounded-2xl border border-white/10 bg-[#120805] p-4 sm:p-5">
                    <div className="flex items-center justify-between text-[#9c887c]">{icon}<span className="text-[10px] uppercase tracking-[.14em]">{label}</span></div>
                    <strong className="font-['Antonio',sans-serif] text-4xl font-thin block mt-7">{String(value)}</strong>
                  </article>
                ))}
              </div>
              <div className="mt-6 grid lg:grid-cols-2 gap-4">
                <article className="rounded-2xl border border-white/10 bg-[#120805] p-5">
                  <h2 className="font-['Antonio',sans-serif] text-2xl">Quick setup</h2>
                  <p className="text-xs leading-5 text-[#927f73] mt-2">First time only: import your current live content into Firestore. After that the admin CMS becomes the source for new content.</p>
                  <div className="flex flex-wrap gap-2 mt-5">
                    <button onClick={seedProjects} className="rounded-full bg-[#f47b38] px-4 py-2 text-xs">Import current projects</button>
                    <button onClick={seedServices} className="rounded-full border border-white/10 px-4 py-2 text-xs">Import services</button>
                  </div>
                </article>
                <article className="rounded-2xl border border-white/10 bg-[#120805] p-5">
                  <h2 className="font-['Antonio',sans-serif] text-2xl">Admin capabilities</h2>
                  <p className="text-xs leading-6 text-[#927f73] mt-2">Unlimited projects, secure gallery uploads, project visibility, live links, services, enquiry pipeline and public site settings are managed here. The owner can add or remove admin emails in one tap.</p>
                </article>
              </div>
            </div>
          )}

          {tab === "projects" && (
            <div className="mt-7 grid xl:grid-cols-[360px_1fr] gap-4">
              <section className="rounded-2xl border border-white/10 bg-[#120805] p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-['Antonio',sans-serif] text-2xl">All Projects</h2>
                  <button onClick={() => setSelectedProject({ ...EMPTY_PROJECT, order: projects.length + 1 })} className="inline-flex items-center gap-1 rounded-full bg-[#f47b38] px-3 py-2 text-xs"><Plus size={14}/> Add</button>
                </div>
                {!projects.length && <p className="mt-5 text-xs text-[#8f7d72]">No CMS projects yet. Use “Import current projects” on Dashboard or add a new one.</p>}
                <div className="mt-4 grid gap-2">
                  {projects.map((project) => (
                    <button key={project.docId} onClick={() => setSelectedProject({ ...project })} className={`grid grid-cols-[58px_1fr_auto] items-center gap-3 rounded-xl border p-2 text-left transition ${selectedProject?.docId === project.docId ? "border-[#f47b38]/50 bg-[#f47b38]/[.06]" : "border-white/8 bg-black/10 hover:border-white/15"}`}>
                      <div className="h-12 overflow-hidden rounded-lg bg-black/30">
                        {project.imageUrl ? <img src={project.imageUrl} alt="" className="h-full w-full object-cover"/> : <div className="h-full grid place-items-center"><ImagePlus size={16}/></div>}
                      </div>
                      <div className="min-w-0">
                        <strong className="block truncate text-sm">{project.title}</strong>
                        <span className="block truncate text-[10px] text-[#806f64]">{project.category || "No category"}</span>
                      </div>
                      {project.visible ? <Eye size={15} className="text-[#f47b38]"/> : <EyeOff size={15} className="text-[#6d5d54]"/>}
                    </button>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-white/10 bg-[#120805] p-4 sm:p-6">
                {selectedProject ? (
                  <ProjectEditor
                    project={selectedProject}
                    busy={busy}
                    onChange={setSelectedProject}
                    onSave={saveProject}
                    onDelete={removeProject}
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
              <div className="flex justify-between gap-3">
                <p className="text-sm text-[#968378]">Add, edit, hide or delete services. There is no fixed limit.</p>
                <button onClick={() => setServices((current) => [...current, { title:"", description:"", order: current.length + 1, visible:true }])} className="shrink-0 inline-flex items-center gap-2 rounded-full bg-[#f47b38] px-4 py-2 text-xs"><Plus size={14}/> Add service</button>
              </div>
              {!services.length && <button onClick={seedServices} className="w-fit rounded-full border border-white/10 px-4 py-2 text-xs">Import current services</button>}
              {services.map((service, index) => (
                <article key={service.docId || `new-${index}`} className="rounded-2xl border border-white/10 bg-[#120805] p-4">
                  <div className="grid lg:grid-cols-[1fr_1.6fr_100px_auto] gap-3 items-end">
                    <Field label="Service" value={service.title} onChange={(value) => setServices((all) => all.map((item, i) => i === index ? {...item,title:value}:item))}/>
                    <Field label="Description" value={service.description} onChange={(value) => setServices((all) => all.map((item, i) => i === index ? {...item,description:value}:item))}/>
                    <Field label="Order" type="number" value={service.order} onChange={(value) => setServices((all) => all.map((item, i) => i === index ? {...item,order:Number(value)}:item))}/>
                    <div className="flex gap-2 pb-0.5">
                      <button onClick={() => setServices((all) => all.map((item, i) => i === index ? {...item,visible:!item.visible}:item))} className="h-11 w-11 grid place-items-center rounded-xl border border-white/10" title="Toggle visibility">{service.visible?<Eye size={16}/>:<EyeOff size={16}/>}</button>
                      <button onClick={() => void saveService(service)} className="h-11 w-11 grid place-items-center rounded-xl bg-[#f47b38]" title="Save"><Save size={16}/></button>
                      {service.docId && <button onClick={() => void deleteService(service)} className="h-11 w-11 grid place-items-center rounded-xl border border-red-500/20 text-red-300" title="Delete"><Trash2 size={16}/></button>}
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
                    <select value={item.status || "new"} onChange={(event) => void updateEnquiryStatus(item.id,event.target.value)} className="rounded-full border border-white/10 bg-[#0d0603] px-3 py-2 text-xs">
                      {["new","contacted","qualified","in-progress","closed"].map((status)=><option value={status} key={status}>{status}</option>)}
                    </select>
                  </div>
                  <div className="mt-4 grid sm:grid-cols-3 gap-3 text-xs">
                    <div><span className="text-[#75655c]">Project</span><p className="mt-1">{item.projectType || "—"}</p></div>
                    <div><span className="text-[#75655c]">Budget</span><p className="mt-1">{item.budget || "—"}</p></div>
                    <div><span className="text-[#75655c]">Timeline</span><p className="mt-1">{item.timeline || "—"}</p></div>
                  </div>
                  {item.projectGoal && <p className="mt-4 border-t border-white/8 pt-4 text-sm leading-6 text-[#b7a79d]">{item.projectGoal}</p>}
                </article>
              )) : <p className="text-sm text-[#8f7d72]">No Firestore enquiries yet.</p>}
            </div>
          )}

          {tab === "reviews" && (
            <div className="mt-7">
              <p className="text-sm text-[#968378]">Published reviews are visible here. Rating moderation is still available through the Telegram Approve / Reject buttons while the review manager is migrated into the admin panel.</p>
              <div className="grid md:grid-cols-2 gap-3 mt-5">
                {reviews.map((review) => (
                  <article key={review.id} className="rounded-2xl border border-white/10 bg-[#120805] p-5">
                    <div className="flex items-center justify-between">
                      <strong>{review.name}</strong><span className="text-[#f47b38]">{review.rating}/5 ★</span>
                    </div>
                    <p className="text-xs text-[#806f64] mt-1">{review.business || "Portfolio visitor"}</p>
                    <p className="text-sm text-[#bdada2] leading-6 mt-4">{review.message}</p>
                  </article>
                ))}
              </div>
            </div>
          )}

          {tab === "admins" && isOwner && (
            <div className="mt-7 max-w-3xl">
              <div className="rounded-2xl border border-white/10 bg-[#120805] p-5 sm:p-6">
                <p className="text-[10px] uppercase tracking-[.18em] text-[#f47b38]">Owner controls</p>
                <h2 className="font-['Antonio',sans-serif] text-3xl mt-2">Admin access</h2>
                <p className="text-sm leading-6 text-[#968378] mt-2">Your owner email has permanent access. To add another admin, just enter their Google email. No UID, Firebase console or manual document setup is needed.</p>

                <div className="mt-5 flex flex-col sm:flex-row gap-2">
                  <input
                    type="email"
                    value={newAdminEmail}
                    onChange={(event) => setNewAdminEmail(event.target.value)}
                    placeholder="newadmin@gmail.com"
                    className="h-12 flex-1 rounded-xl border border-white/10 bg-[#0d0603] px-4 text-sm text-[#f4e9e1] outline-none focus:border-[#f47b38]/60"
                  />
                  <button onClick={() => void addAdmin()} className="h-12 rounded-xl bg-[#f47b38] px-5 text-sm text-white inline-flex items-center justify-center gap-2"><Plus size={16}/> Add Admin</button>
                </div>

                <div className="mt-6 grid gap-2">
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-[#f47b38]/25 bg-[#f47b38]/[.06] p-4">
                    <div>
                      <strong className="text-sm">{OWNER_EMAIL}</strong>
                      <p className="text-[10px] uppercase tracking-[.12em] text-[#f47b38] mt-1">Owner · permanent access</p>
                    </div>
                    <span className="text-xs text-[#d6b29e]">Protected</span>
                  </div>

                  {admins.map((admin) => (
                    <div key={admin.email} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/10 p-4">
                      <div>
                        <strong className="text-sm">{admin.email}</strong>
                        <p className="text-[10px] uppercase tracking-[.12em] text-[#77665d] mt-1">Admin</p>
                      </div>
                      <button onClick={() => void removeAdmin(admin.email)} className="inline-flex items-center gap-2 rounded-full border border-red-500/20 px-3 py-2 text-xs text-red-300"><Trash2 size={14}/> Remove</button>
                    </div>
                  ))}
                </div>
              </div>
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
  const preview = imageFile ? URL.createObjectURL(imageFile) : project.imageUrl;

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
          <div className="mt-3"><Field label="Or image URL" type="url" value={project.imageUrl} onChange={(value)=>onChange({...project,imageUrl:value})} placeholder="https://..."/></div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Field label="Order" type="number" value={project.order} onChange={(value)=>onChange({...project,order:Number(value)})}/>
            <Field label="Card color" type="color" value={project.color} onChange={(value)=>onChange({...project,color:value})}/>
          </div>
          <div className="mt-4 flex gap-3">
            <button onClick={()=>onChange({...project,visible:!project.visible})} className={`flex-1 rounded-xl border px-3 py-3 text-xs ${project.visible?"border-[#f47b38]/35 bg-[#f47b38]/[.06]":"border-white/10"}`}>{project.visible?"Visible":"Hidden"}</button>
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
