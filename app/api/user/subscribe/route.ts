export async function POST(req: Request) {
  const session = await auth();
  
  // LOGGING: This will appear in your Vercel Dashboard -> Logs
  console.log("DEBUG - Session object:", JSON.stringify(session));

  if (!session?.user?.id) {
    return NextResponse.json({ 
      error: "Unauthorized", 
      details: "No session found" 
    }, { status: 401 });
  }

  const subscription = await req.json();
  
  try {
    await prisma.subscription.create({
      data: {
        userId: session.user.id,
        data: subscription,
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Subscription error:", error);
    return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 });
  }
}