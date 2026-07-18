import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import PackClientWrapper from "@/components/PackClientWrapper";

export default async function PackDetailsPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;

  try {
    const pack = await prisma.pack.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!pack) {
      notFound();
    }

    return <PackClientWrapper pack={pack} />;
  } catch (error) {
    console.error("Database error in PackDetailsPage:", error);
    return (
      <div className="min-h-screen bg-[#070707] flex items-center justify-center text-red-400 p-6 text-center">
        <div>
          <h2 className="text-xl font-bold">Unable to load pack.</h2>
          <p className="text-sm opacity-70">Please check your database connection.</p>
        </div>
      </div>
    );
  }
}