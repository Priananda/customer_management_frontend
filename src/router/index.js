import { createRouter, createWebHistory } from 'vue-router';
import DashboardHome from '../views/DashboardHome.vue';
import Dashboard from '../layouts/Dashboard.vue';
import RegisterPICStaff from '../views/RegisterPICStaff.vue';
import LoginPICStaff from '../views/LoginPICStaff.vue';
import LoginAdmin from '../views/LoginAdmin.vue';
import LoginSuperAdmin from '../views/LoginSuperAdmin.vue';
import NewCustomer from '../views/NewCustomer.vue';
import DealCustomer from '../views/DealCustomer.vue';


import { authGuard } from './middleware.js';

const routes = [

  { path: '/', redirect: '/login-admin' },

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
      
     

      { path: '', redirect: 'new-customer' }
    ]
  },

  // Fallback
  { path: '/:pathMatch(.*)*', redirect: '/login-admin' }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
