'use server';

import { revalidatePath } from 'next/cache';

/** Na upload/wijziging: publieke /files en docentenportaal opnieuw laten renderen. */
export async function revalidateAfterFileChange() {
  revalidatePath('/files');
  revalidatePath('/teacher');
}
