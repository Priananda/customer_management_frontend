import { useRouter } from "vue-router";

export function useLogout() {
  const router = useRouter();
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");

  const mainRole = user.role;
  const extraRoles = user.extra_roles || [];

  const isDriver = extraRoles.includes("driver");

  const logout = () => {
   
    sessionStorage.removeItem("user");

    if (isDriver) {
      router.push("/login-driver");
      return;
    }

    switch (mainRole) {
      case "pic":
      case "staff":
        router.push("/login-pic-staff");
        break;
      case "admin":
        router.push("/login-admin");
        break;
      case "super_admin":
        router.push("/login-super-admin");
        break;
      default:
        router.push("/login-admin");
    }
  };

  return {
    logout,
    mainRole,
    extraRoles,
    isDriver
  };
}
