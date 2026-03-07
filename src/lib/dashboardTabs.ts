import type { AdminRole } from '../types/index.js';

/** Canonical list of dashboard tab keys in nav order. Only super_admin gets "users". */
export const DASHBOARD_TAB_KEYS = [
  'overview',
  'users',
  'categories',
  'products',
  'sub-products',
  'testimonials',
  'contact',
  'newsletter',
  'blogs',
  'content',
  'case-studies',
  'events',
  'clients',
  'trusted-partners',
  'footer-links',
  'locations',
  'faqs',
  'social-links',
] as const;

export type DashboardTabKey = (typeof DASHBOARD_TAB_KEYS)[number];

/** Default tabs for non–super_admin when visibleTabs is not set (all except users). */
const DEFAULT_TABS_NON_SUPER = DASHBOARD_TAB_KEYS.filter((k) => k !== 'users');

/**
 * Returns the list of tab keys the admin is allowed to see.
 * - super_admin: all tabs.
 * - Else if visibleTabs is set: intersection with DASHBOARD_TAB_KEYS.
 * - Else: role default (all except users).
 */
export function getAllowedTabs(admin: {
  role?: AdminRole;
  visibleTabs?: string[] | null;
}): string[] {
  if (admin.role === 'super_admin') {
    return [...DASHBOARD_TAB_KEYS];
  }
  if (admin.visibleTabs && admin.visibleTabs.length > 0) {
    const set = new Set(DASHBOARD_TAB_KEYS);
    return admin.visibleTabs.filter((k) => set.has(k as DashboardTabKey));
  }
  return [...DEFAULT_TABS_NON_SUPER];
}

/** Validates that every key in tabs is in DASHBOARD_TAB_KEYS. Returns false if any invalid. */
export function isValidVisibleTabs(tabs: unknown): tabs is string[] {
  if (!Array.isArray(tabs)) return false;
  const set = new Set(DASHBOARD_TAB_KEYS);
  return tabs.every((k) => typeof k === 'string' && set.has(k as DashboardTabKey));
}
