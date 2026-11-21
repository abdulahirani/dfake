import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const ADMIN_EMAIL = 'gundkatira007@gmail.com';

export function isVerifiedAdmin(user: User | null | undefined): boolean {
  if (!user) return false;
  return user.email === ADMIN_EMAIL && user.emailVerified === true;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('the client is offline')
    ) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

export interface Post {
  id: string;
  title: string;
  desc: string;
  date: string;
  imageUrl: string;
  alt: string;
  content: string;
  category?: string;
  metaDesc?: string;
  author?: string;
  published?: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export interface FAQ {
  q: string;
  a: string;
}

export interface AppConfig {
  faqs: FAQ[];
  settings: {
    siteName?: string;
    siteDescription?: string;
    domain?: string;
    version?: string;
    faviconUrl: string;
    adsEnabled: boolean;
    adsClient: string;
    customAdCode?: string;
    faqCatalogVersion?: string;
  };
  legal: {
    privacy: string;
    terms: string;
    disclaimer: string;
    about: string;
    docs: string;
  };
}

export function slugifyPostId(raw: string): string {
  const cleaned = raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 128);
  return cleaned || `post-${Date.now()}`;
}

export function sanitizePostPayload(post: Post, isUpdate: boolean) {
  const id = slugifyPostId(post.id);
  const title = (post.title || 'Untitled Report').trim().slice(0, 200);
  const content = (post.content || '<p>No content provided.</p>').slice(0, 50000);
  const desc = (post.desc || '').trim().slice(0, 500);
  const date = (
    post.date ||
    new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    })
  )
    .trim()
    .slice(0, 64);
  const imageUrl = (
    post.imageUrl || 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b'
  )
    .trim()
    .slice(0, 1000);
  const alt = (post.alt || title).trim().slice(0, 300);
  const category = (post.category || 'Daily Brief').trim().slice(0, 64);
  const metaDesc = (post.metaDesc || desc || title).trim().slice(0, 300);
  const author = (post.author || 'ScanDeepFake Editorial').trim().slice(0, 120);
  const published = post.published !== false;

  const payload: Record<string, any> = {
    id,
    title,
    desc,
    date,
    imageUrl,
    alt,
    content,
    category,
    metaDesc,
    author,
    published,
    updatedAt: serverTimestamp(),
  };

  if (isUpdate && post.createdAt) {
    payload.createdAt = post.createdAt;
  } else if (!isUpdate) {
    payload.createdAt = serverTimestamp();
  }

  return payload;
}

export async function signInAdminWithGoogle() {
  return signInWithPopup(auth, googleProvider);
}

export async function signOutAdmin() {
  return signOut(auth);
}

export async function savePostToFirestore(post: Post, existsInFirestore: boolean) {
  const id = slugifyPostId(post.id);
  const path = `posts/${id}`;
  const payload = sanitizePostPayload({ ...post, id }, existsInFirestore);
  try {
    await setDoc(doc(db, 'posts', id), payload, { merge: false });
    return id;
  } catch (error) {
    handleFirestoreError(
      error,
      existsInFirestore ? OperationType.UPDATE : OperationType.CREATE,
      path
    );
  }
}

export async function deletePostFromFirestore(postId: string) {
  const path = `posts/${postId}`;
  try {
    await deleteDoc(doc(db, 'posts', postId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveConfigToFirestore(config: AppConfig) {
  const path = 'config/main';
  const sanitizedFaqs = (config.faqs || []).slice(0, 100).map((f) => ({
    q: (f.q || '').slice(0, 500),
    a: (f.a || '').slice(0, 5000),
  }));
  const payload = {
    faqs: sanitizedFaqs,
    settings: {
      ...(config.settings || {}),
      faqCatalogVersion: '2026-11',
    },
    legal: config.legal || {},
    updatedAt: serverTimestamp(),
  };
  try {
    await setDoc(doc(db, 'config', 'main'), payload, { merge: false });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
