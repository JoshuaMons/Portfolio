'use server';

import { revalidatePortfolioContent } from '@/app/admin/revalidate-content';

/** Na upload/wijziging: home, projecten, /files, docentenportaal en admin-lijsten opnieuw laten renderen. */
export async function revalidateAfterFileChange() {
  await revalidatePortfolioContent();
}
