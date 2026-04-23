import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

function requiredEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name}`);
  return v;
}

function isEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });

    const name = String(body.name ?? '').trim().slice(0, 120);
    const email = String(body.email ?? '').trim().slice(0, 200);
    const message = String(body.message ?? '').trim().slice(0, 4000);
    const rating = Number(body.rating ?? 0);
    const pageUrl = String(body.pageUrl ?? '').trim().slice(0, 500);

    if (!name || !email || !message) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    if (!isEmail(email)) return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) return NextResponse.json({ error: 'Invalid rating' }, { status: 400 });

    const supabaseUrl = requiredEnv('NEXT_PUBLIC_SUPABASE_URL');
    const serviceRole = requiredEnv('SUPABASE_SERVICE_ROLE_KEY');
    const adminUserId = requiredEnv('ADMIN_USER_ID');
    const fallbackAdminEmail = process.env.ADMIN_EMAIL || null;
    const resendKey = requiredEnv('RESEND_API_KEY');

    const supabase = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });
    const { data: profile } = await supabase
      .from('profiles')
      .select('contact_email')
      .eq('id', adminUserId)
      .maybeSingle();

    const to = (profile as any)?.contact_email || fallbackAdminEmail;
    if (!to || !isEmail(String(to))) {
      return NextResponse.json(
        { error: 'Admin email not configured (set it in /admin/profile or ADMIN_EMAIL env)' },
        { status: 500 }
      );
    }

    const resend = new Resend(resendKey);
    const subject = `Nieuwe review (${rating}/5) — Joshua's Portfolio`;
    const text = [
      `Naam: ${name}`,
      `Email: ${email}`,
      `Rating: ${rating}/5`,
      pageUrl ? `Pagina: ${pageUrl}` : null,
      '',
      message,
    ]
      .filter(Boolean)
      .join('\n');

    await resend.emails.send({
      from: 'JoshuasPortfolio <onboarding@resend.dev>',
      to: String(to),
      subject,
      text,
      replyTo: email,
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Server error' }, { status: 500 });
  }
}

