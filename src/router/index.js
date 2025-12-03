import { createRouter, createWebHistory } from 'vue-router';
import DashboardHome from '../views/DashboardHome.vue';
import Dashboard from '../layouts/Dashboard.vue';
import RegisterPICStaff from '../views/RegisterPICStaff.vue';
import LoginPICStaff from '../views/LoginPICStaff.vue';
import LoginAdmin from '../views/LoginAdmin.vue';
import LoginSuperAdmin from '../views/LoginSuperAdmin.vue';
import NewCustomer from '../views/NewCustomer.vue';
import DealCustomer from '../views/DealCustomer.vue';
import ViewDataPIC from '../views/ViewDataPIC.vue';
import ViewDataStaff from '../views/ViewDataStaff.vue';
import ViewDataAdmin from '../views/ViewDataAdmin.vue';
import UploadCSV from '../views/UploadCSV.vue';

import { authGuard } from './middleware.js';

const routes = [
  // Public route
  { path: '/register-pic-staff', component: RegisterPICStaff },
  { path: '/login-pic-staff', component: LoginPICStaff },
  { path: '/login-admin', component: LoginAdmin },
  { path: '/login-super-admin', component: LoginSuperAdmin },

  // Dashboard + Nested routes
  {
    path: '/dashboard',
    component: Dashboard,
    meta: { allowedRoles: ['pic','staff','admin','super_admin'] },
    beforeEnter: authGuard,
    children: [
      { path: 'home', component: DashboardHome },
      { 
        path: 'new-customer', 
        component: NewCustomer,
        meta: { allowedRoles: ['pic','staff','admin','super_admin'] }
      },
      { 
        path: 'deal-customer', 
        component: DealCustomer,
        meta: { allowedRoles: ['pic','staff','admin','super_admin'] }
      },
      { 
        path: 'view-data-pic', 
        component: ViewDataPIC,
        meta: { allowedRoles: ['admin','super_admin'] }
      },
      { 
        path: 'view-data-staff', 
        component: ViewDataStaff,
        meta: { allowedRoles: ['admin','super_admin'] }
      },
      { 
        path: 'view-data-admin', 
        component: ViewDataAdmin,
        meta: { allowedRoles: ['super_admin'] }
      },
      //  { 
      //   path: 'upload-csv', 
      //   component: UploadCSV,
      //   meta: { allowedRoles: ['pic','staff','admin','super_admin'] }
      // },

      { path: '', redirect: 'new-customer' }
    ]
  },

  // Fallback
  { path: '/:pathMatch(.*)*', redirect: '/dashboard/home' }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
