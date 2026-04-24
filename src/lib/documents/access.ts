import { auth } from '@clerk/nextjs/server';
import { notFound } from 'next/navigation';
import { verifyDocumentToken, type DocumentKind } from './shared';

export async function requireDocumentAccess(
  kind: DocumentKind,
  id: number,
  token?: string | null
): Promise<void> {
  if (verifyDocumentToken(token, kind, id)) {
    return;
  }

  const { userId } = await auth();
  if (!userId) {
    notFound();
  }
}
