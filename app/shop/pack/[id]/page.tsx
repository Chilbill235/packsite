import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import PackClientWrapper from "@/components/PackClientWrapper";

// params must be a Promise in Next.js 15+
export default async function PackDetailsPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  // Await the params before accessing the ID
  const { id } = await params;

  const pack = await prisma.pack.findUnique({
    where: { id: id },
    include: { items: true },
  });

  if (!pack) {
    notFound();
  }

  return <PackClientWrapper pack={pack} />;
}