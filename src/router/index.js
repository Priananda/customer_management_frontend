import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/auth";


import Dashboard from "../layouts/Dashboard.vue";


// import LoginPICStaff from "../views/LoginPICStaff.vue";
import LoginAdmin from "../views/LoginAdmin.vue";
import LoginSuperAdmin from "../views/LoginSuperAdmin.vue";
import LoginDriver from "../views/LoginDriver.vue";
// import RegisterPICStaff from "../views/RegisterPICStaff.vue";


import DashboardHome from "../views/DashboardHome.vue";
import NewCustomer from "../views/NewCustomer.vue";
import DealCustomer from "../views/DealCustomer.vue";

import LaporanDriver from "../views/LaporanDriver.vue";


import DriverHeatMap from "../components/DriverHeatMap.vue";


import Driver from "../views/Driver.vue";


const routes = [
  { path: "/", redirect: "/login-admin" },

 
  // { path: "/login-pic-staff", component: LoginPICStaff },
  { path: "/login-admin", component: LoginAdmin },
  { path: "/login-super-admin", component: LoginSuperAdmin },
  { path: "/login-driver", component: LoginDriver },
  // { path: "/register-pic-staff", component: RegisterPICStaff },
   { path: "/driver-heat-map", component: DriverHeatMap },
 
  {
    path: "/dashboard",
    component: Dashboard,
    children: [
      { path: "home", component: DashboardHome },
      { path: "new-customer", component: NewCustomer },
      { path: "deal-customer", component: DealCustomer },
        { path: "laporan-driver", component: LaporanDriver },
      { path: "", redirect: "home" },
    ],
  },

 
  {
    path: "/dashboard-driver",
    component: Dashboard,
    children: [
      { path: "listing", component: Driver },
      { path: "", redirect: "listing" },
    ],
  },

  { path: "/:pathMatch(.*)*", redirect: "/login-admin" },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});


router.beforeEach((to) => {
  const auth = useAuthStore();
  const user = auth.user;

  if (!user) {
    if (to.path.startsWith("/dashboard-driver")) {
      return "/login-driver";
    }

    if (to.path.startsWith("/dashboard")) {
      return "/login-admin";
    }

    return true;
  }

  
  const mainRole = user.role;
  const extraRoles = user.extra_roles || [];
  const roles = [mainRole, ...extraRoles];

  const isDriver = roles.includes("driver");
  const isAdmin = ["admin", "super_admin"].includes(mainRole);

  if (isDriver && !isAdmin) {

    if (
      to.path.startsWith("/dashboard") &&
      !to.path.startsWith("/dashboard-driver")
    ) {
      return "/dashboard-driver/listing";
    }

    if (
      [
        "/login-admin",
        "/login-super-admin",
        "/login-pic-staff",
        "/register-pic-staff",
      ].includes(to.path)
    ) {
      return "/dashboard-driver/listing";
    }
  }


  return true;
});

export default router;
