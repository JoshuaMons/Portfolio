'use server';

import { revalidatePath } from 'next/cache';

/** Invalideer publieke en admin-routes na content-mutaties (home, projecten, docent, uploads, …). */
export async function revalidatePortfolioContent() {
  revalidatePath('/');
  revalidatePath('/projects');
  revalidatePath('/files');
  revalidatePath('/teacher');
  revalidatePath('/admin');
  revalidatePath('/admin/content');
  revalidatePath('/admin/projects');
  revalidatePath('/admin/uploads');
  revalidatePath('/admin/teacher-assignments');
}
