import { ProjectPageClient } from "@/features/projects/components/project-page-client";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProjectPageClient projectId={id} />;
}
