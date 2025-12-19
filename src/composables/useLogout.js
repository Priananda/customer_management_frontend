import { useRouter } from "vue-router";

export function useLogout() {
  const router = useRouter();
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  const role = user.role;

  const logout = () => {
    // Tampilkan info sesuai role
    if (role === "pic" || role === "staff") {
      console.log("Logging out. Related New Customer ID:", user.new_customer_id);
      console.log("Logging out. Related Deal Customer ID:", user.deal_customer_id);
    
     } else if (role === "admin" || role === "super_admin") {
      console.log("Logging out. Admin/Super Admin ID:", user.id);
    }

    // Hapus session / localStorage
    sessionStorage.removeItem("user");

    // Redirect sesuai role
    switch (role) {
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
        router.push("/login-admin"); // fallback
    }
  };

  return { logout, role };
}
