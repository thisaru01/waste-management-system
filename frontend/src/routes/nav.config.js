// Role-based navigation config for the Sidebar.
// Add or change items here; the Sidebar will render them automatically based on user roles.

export const NAV_ITEMS = [
  {
    label: 'Dashboard',
    to: '/',
    icon: 'home',
    roles: '*', // visible to all authenticated users
  },
  // Admin section
  {
    label: 'User Management',
    to: '/admin/users',
    icon: 'users',
    roles: ['admin'],
  },
  {
    label: 'Sensor Simulation',
    to: '/admin/sensors',
    icon: 'beaker',
    roles: ['admin'],
  },
  // Example placeholders for future areas; adjust role targeting as needed
  {
    label: 'Collections',
    to: '/coming-soon/collections',
    icon: 'collection',
    roles: ['authority', 'collector'],
  },
  {
    label: 'Collection History',
    to: '/coming-soon/collection-history',
    icon: 'history',
    roles: ['authority', 'collector'],
  },
  {
    label: 'Payments',
    to: '/payments',
    icon: 'payments',
    roles: ['bin-owner'],
  },
  {
    label: 'Schedule Pickup',
    to: '/schedule-pickup',
    icon: 'calendar',
    roles: ['bin-owner'],
  },
  {
    label: 'Data Analysis',
    to: '/coming-soon/data-analysis',
    icon: 'chart',
    roles: ['analysis', 'authority'],
  },
  {
    label: 'Settings',
    to: '/settings',
    icon: 'settings',
    roles: ['bin-owner'],
  },
];

export function filterNavItemsByRoles(items, userRoles) {
  if (!Array.isArray(userRoles)) return [];
  const names = new Set(userRoles.map((r) => r.name));
  return items.filter((it) => it.roles === '*' || it.roles.some((r) => names.has(r)));
}
