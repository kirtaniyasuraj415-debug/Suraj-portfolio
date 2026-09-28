import CaseStudy from "@/components/public/case-study";

export default async function ProjectCaseStudyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <CaseStudy slug={slug} />;
}
