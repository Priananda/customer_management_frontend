import { useAuthStore } from "../stores/auth";

export function authGuard(to) {
  const auth = useAuthStore();
  const user = auth.user;

  if (!user) {
    if (to.path.startsWith("/dashboard-driver")) {
      return { path: "/login-driver" };
    }

    if (to.path.startsWith("/dashboard")) {
      return { path: "/login-admin" };
    }

    return;
  }


  const mainRole = user.role;
  const extraRoles = user.extra_roles || [];
  const roles = [mainRole, ...extraRoles];

  const isDriver = roles.includes("driver");
  const isAdmin = ["admin", "super_admin"].includes(mainRole);


  if (isDriver && !isAdmin) {
    
    if (to.path.startsWith("/dashboard") && !to.path.startsWith("/dashboard-driver")) {
      return { path: "/dashboard-driver/listing" };
    }

   
    if (
      ["/login-admin", "/login-super-admin", "/login-pic-staff", "/register-pic-staff"].includes(to.path)
    ) {
      return { path: "/dashboard-driver/listing" };
    }
  }


  if (to.meta?.allowedRoles) {
    const allowed = to.meta.allowedRoles;
    const hasAccess = allowed.some((r) => roles.includes(r));

    if (!hasAccess) {
      return false; 
    }
  }

}
