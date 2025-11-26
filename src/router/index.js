import { createRouter, createWebHistory } from 'vue-router';
import RegisterPICStaff from '../views/RegisterPICStaff.vue';
import LoginPICStaff from '../views/LoginPICStaff.vue';
import LoginAdmin from '../views/LoginAdmin.vue';
import LoginSuperAdmin from '../views/LoginSuperAdmin.vue';
import Dashboard from '../views/Dashboard.vue';
import NewCustomer from '../views/NewCustomer.vue';
import DealCustomer from '../views/DealCustomer.vue';

// Admin & Super_admin
import ViewDataPIC from '../views/ViewDataPIC.vue';
import ViewDataStaff from '../views/ViewDataStaff.vue';
import ViewDataAdmin from '../views/ViewDataAdmin.vue';

import { authGuard } from './middleware.js';

const routes = [
  { path: '/register-pic-staff', name: 'RegisterPICStaff', component: RegisterPICStaff },
  { path: '/login-pic-staff', name: 'LoginPICStaff', component: LoginPICStaff },
  { path: '/login-admin', name: 'LoginAdmin', component: LoginAdmin },
  { path: '/login-super-admin', name: 'LoginSuperAdmin', component: LoginSuperAdmin },

  { 
    path: '/dashboard', 
    name: 'Dashboard', 
    component: Dashboard,
    meta: { allowedRoles: ['pic','staff','admin','super_admin'] },
    beforeEnter: authGuard
  },
  { 
    path: '/new-customer', 
    name: 'NewCustomer', 
    component: NewCustomer,
    meta: { allowedRoles:  ['pic','staff','admin','super_admin']  },
    beforeEnter: authGuard
  },
   { 
    path: '/deal-customer', 
    name: 'DealCustomer', 
    component: DealCustomer,
    meta: { allowedRoles:  ['pic','staff','admin','super_admin']  },
    beforeEnter: authGuard
  },

  // Admin & Super_admin
  {
    path: "/view-data-pic",
    name: "ViewDataPic",
    meta: { allowedRoles:  ['admin','super_admin']  },
    component: ViewDataPIC,
  },
  {
    path: "/view-data-staff",
    name: "ViewDataStaff",
    meta: { allowedRoles:  ['admin','super_admin']  },
    component: ViewDataStaff,
  },
  {
    path: "/view-data-admin",
    name: "ViewDataAdmin",
    meta: { allowedRoles:  ['admin','super_admin']  },
    component: ViewDataAdmin,
  },

];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
