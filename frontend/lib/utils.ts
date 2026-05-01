import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Appends the auth token as a `?token=...` query param so that browser-initiated
 * requests (image tags, <model-viewer>, window.open downloads, OBJLoader) can
 * authenticate against endpoints that don't receive Authorization headers.
 */
export function withAuth(url: string): string {
  if (typeof window === 'undefined') return url;
  const token = localStorage.getItem('authToken');
  if (!token) return url;
  return url + (url.includes('?') ? '&' : '?') + 'token=' + encodeURIComponent(token);
}
