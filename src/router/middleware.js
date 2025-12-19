import { useAuthStore } from "../stores/auth";

export function authGuard(to, from) {
  const auth = useAuthStore();
  const user = auth.user;

  if (!user) {
    if (to.path.startsWith("/dashboard")) {
      return { path: "/login-admin" };
    }

    if (to.meta.allowedRoles?.includes("pic") || to.meta.allowedRoles?.includes("staff")) {
      return { path: "/login-pic-staff" };
    }

    if (to.meta.allowedRoles?.includes("admin")) {
      return { path: "/login-admin" };
    }

    if (to.meta.allowedRoles?.includes("super_admin")) {
      return { path: "/login-super-admin" };
    }

    // Fallback
    return { path: "/login-admin" };
  }


  const role = user.role;
  if (to.meta.allowedRoles && !to.meta.allowedRoles.includes(role)) {
    alert("Anda tidak memiliki akses ke halaman ini");
    return false;
  }

  return true;
}
