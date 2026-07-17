import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Ensures the route is never statically cached
export const dynamic = 'force-dynamic';

export async function GET() {
  const start = Date.now();
  try {
    const baseUrl = 'https://packsite.vercel.app';
    
    // Aggregate live telemetry and data
    const [packs, users, inventory, pCount, uCount] = await Promise.all([
      prisma.pack.findMany({ select: { id: true, name: true } }),
      prisma.user.findMany({ select: { username: true, createdAt: true } }),
      prisma.inventory.findMany({ select: { id: true }, take: 10 }),
      prisma.pack.count(),
      prisma.user.count()
    ]);

    const latency = Date.now() - start;

    // Build the XML with custom namespaces for dashboard telemetry
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:sys="http://packsite.app/sys">\n`;
    
    // Inject Live Telemetry
    xml += `  <sys:telemetry>\n`;
    xml += `    <sys:latency>${latency}ms</sys:latency>\n`;
    xml += `    <sys:packs>${pCount}</sys:packs>\n`;
    xml += `    <sys:users>${uCount}</sys:users>\n`;
    xml += `    <sys:serverTime>${new Date().toISOString()}</sys:serverTime>\n`;
    xml += `  </sys:telemetry>\n`;

    // Map Routes
    xml += `  <url><loc>${baseUrl}</loc><changefreq>daily</changefreq><priority>1.0</priority></url>\n`;
    
    packs.forEach(p => xml += `  <url><loc>${baseUrl}/packs/${p.id}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>\n`);
    users.forEach(u => xml += `  <url><loc>${baseUrl}/users/${u.username}</loc><lastmod>${u.createdAt.toISOString().split('T')[0]}</lastmod><changefreq>daily</changefreq><priority>0.7</priority></url>\n`);

    xml += `</urlset>`;

    return new NextResponse(xml, { 
        status: 200, 
        headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'no-store' } 
    });
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}