import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Optional: validate file type or size
    const blob = await put(`uploads/${Date.now()}-${file.name}`, file, {
      access: 'public',
      contentType: file.type,
    });

    return NextResponse.json(blob);
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
