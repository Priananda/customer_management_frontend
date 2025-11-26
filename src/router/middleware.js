// middleware.js
export function authGuard(to, from) {
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  // Conditional USER BELUM LOGIN
  if (!user) {
    // Route untuk PIC atau STAFF
    if (to.meta.allowedRoles?.includes('pic') || to.meta.allowedRoles?.includes('staff')) {
      return { path: '/login-pic-staff' };
    }

    // Route untuk ADMIN
    if (to.meta.allowedRoles?.includes('admin')) {
      return { path: '/login-admin' };
    }

    // Route untuk SUPER ADMIN
    if (to.meta.allowedRoles?.includes('super_admin')) {
      return { path: '/login-super-admin' };
    }

    // fallback
    return { path: '/login-pic-staff' };
  }

  // User sudah login lalu cek rola
  const role = user.role;

  if (to.meta.allowedRoles && !to.meta.allowedRoles.includes(role)) {
    alert('Anda tidak memiliki akses ke halaman ini');
    return false;
  }

  return true; // Jika ada role lanjutkan
}
