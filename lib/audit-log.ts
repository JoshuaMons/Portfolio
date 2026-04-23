import type { SupabaseClient } from '@supabase/supabase-js';

type LogInput = {
  action: string;
  entity: string;
  entity_id?: string | null;
  summary: string;
};

export async function writeAuditLog(
  supabase: SupabaseClient,
  input: LogInput
) {
  const { data: userData } = await supabase.auth.getUser();
  const ownerId = userData.user?.id;
  if (!ownerId) return;

  await supabase.from('audit_logs').insert({
    owner_id: ownerId,
    action: input.action,
    entity: input.entity,
    entity_id: input.entity_id ?? null,
    summary: input.summary,
  });

  // Keep only last 7 days
  await supabase
    .from('audit_logs')
    .delete()
    .eq('owner_id', ownerId)
    .lt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
}

