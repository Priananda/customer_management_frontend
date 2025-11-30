import { useAuthStore } from "../stores/auth";

export function authGuard(to, from) {
  const auth = useAuthStore();
  const user = auth.user;

  // USER BELUM LOGIN
  if (!user) {
    // Route untuk PIC atau STAFF
    if (to.meta.allowedRoles?.includes("pic") || to.meta.allowedRoles?.includes("staff")) {
      return { path: "/login-pic-staff" };
    }

    // Route untuk ADMIN
    if (to.meta.allowedRoles?.includes("admin")) {
      return { path: "/login-admin" };
    }

    // Route untuk SUPER ADMIN
    if (to.meta.allowedRoles?.includes("super_admin")) {
      return { path: "/login-super-admin" };
    }

    // fallback
    return { path: "/login-pic-staff" };
  }

  // User sudah login, cek role
  const role = user.role;

  if (to.meta.allowedRoles && !to.meta.allowedRoles.includes(role)) {
    alert("Anda tidak memiliki akses ke halaman ini");
    return false;
  }

  return true; // Jika role cocok, lanjutkan
}
