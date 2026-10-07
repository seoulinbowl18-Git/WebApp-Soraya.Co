import { NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/store';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// POST /api/admin/upload (multipart/form-data, field 'file')
// Response: { url: "/uploads/<name>" }
export async function POST(request) {
  if (!checkAdmin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  try {
    const form = await request.formData();
    const file = form.get('file');
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'File tidak ditemukan di field "file"' }, { status: 400 });
    }

    // Validate size (max 5MB) & type
    const MAX = 5 * 1024 * 1024;
    if (file.size > MAX) {
      return NextResponse.json({ error: 'Ukuran file maks 5MB' }, { status: 400 });
    }
    const type = file.type || '';
    if (!type.startsWith('image/')) {
      return NextResponse.json({ error: 'Harus file gambar (jpg/png/webp)' }, { status: 400 });
    }

    // Generate unique filename
    const ext = (file.name && file.name.includes('.') ? file.name.split('.').pop() : 'jpg')
      .toLowerCase()
      .slice(0, 5)
      .replace(/[^a-z0-9]/g, '');
    const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) ? ext : 'jpg';
    const name = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${safeExt}`;

    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadsDir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(join(uploadsDir, name), buffer);

    return NextResponse.json({
      success: true,
      url: `/uploads/${name}`,
      size: file.size,
      type: file.type,
      name,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: error.message || 'Gagal upload' }, { status: 500 });
  }
}
