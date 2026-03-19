export const NAV_ITEMS = [
  {
    path: '/dashboard',
    label: 'Dashboard',
    icon: 'dashboard',
  },
  {
    path: '/books',
    label: 'Books',
    icon: 'books',
  },
  {
    path: '/customers',
    label: 'Customers',
    icon: 'customers',
  },
  {
    path: '/transactions',
    label: 'Transactions',
    icon: 'transactions',
  },
  {
    path: '/users',
    label: 'User Management',
    icon: 'users',
    adminOnly: true,
  },
];

export function getPageTitle(pathname) {
  if (pathname === '/login') {
    return 'Login';
  }

  const activeItem = NAV_ITEMS.find(
    (item) => pathname === item.path || pathname.startsWith(`${item.path}/`)
  );

  return activeItem?.label ?? 'Library MS';
}
