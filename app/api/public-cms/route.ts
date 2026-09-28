import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  DEFAULT_SERVICES,
  DEFAULT_SITE_SETTINGS,
  cmsProjectToPortfolio,
  type CmsProject,
  type CmsService,
} from "@/lib/cms";
import { getPortfolioProjects } from "@/lib/server/telegram-project-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const fallbackProjects = await getPortfolioProjects().catch(() => []);
  let projects = fallbackProjects;
  let services: CmsService[] = DEFAULT_SERVICES;
  let settings = DEFAULT_SITE_SETTINGS;

  try {
    const projectSnap = await getDocs(
      query(collection(db, "portfolioProjects"), where("visible", "==", true))
    );
    if (projectSnap.size > 0) {
      const cmsProjects = projectSnap.docs
        .map((item) => ({
          docId: item.id,
          ...(item.data() as Omit<CmsProject, "docId">),
        }))
        .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
      projects = cmsProjects.map(cmsProjectToPortfolio);
    }
  } catch {}

  try {
    const serviceSnap = await getDocs(
      query(collection(db, "portfolioServices"), where("visible", "==", true))
    );
    if (serviceSnap.size > 0) {
      services = serviceSnap.docs
        .map((item) => ({
          docId: item.id,
          ...(item.data() as Omit<CmsService, "docId">),
        }))
        .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
    }
  } catch {}

  try {
    const settingsSnap = await getDoc(doc(db, "portfolioSettings", "public"));
    if (settingsSnap.exists()) {
      settings = {
        ...DEFAULT_SITE_SETTINGS,
        ...(settingsSnap.data() as Partial<typeof DEFAULT_SITE_SETTINGS>),
      };
    }
  } catch {}

  return Response.json(
    { projects, services, settings },
    {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
      },
    }
  );
}
