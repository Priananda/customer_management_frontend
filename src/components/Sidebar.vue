<script setup>
import { ref } from "vue";
import {
  ChevronDown,
  ChevronRight,
  Home,
  Users,
  UserPlus,
  FileCheck,
  User,
  Shield,
  LogOut,
} from "lucide-vue-next";

const props = defineProps({
  user: Object,
  role: String,
  logout: Function,
  logoutRole: String,
  collapsed: Boolean,
});

const emit = defineEmits(["toggle"]);

// Control submenu dropdown
const openMenu = ref({
  dashboard: true,
  customer: true,
  management: true,
});

function toggleMenu(name) {
  openMenu.value[name] = !openMenu.value[name];
}

function NameInitial(name) {
  if (!name) return "";
  return name
    .split(" ")
    .map((n) => n[0].toUpperCase())
    .join("");
}

function formatName(name) {
  if (!name) return "";
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

function handleLogout() {
  emit("loading-start");
  setTimeout(() => {
    props.logout(); // Jalankan logout asli
  }, 300);
}
</script>

<template>
  <transition name="slide">
    <aside
      v-if="!collapsed"
      class="w-64 bg-white fixed top-0 left-0 bottom-0 flex flex-col shadow-xl shadow-blue-50"
    >
      <!-- Header -->
      <div class="p-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div
            class="bg-linear-to-r from-cyan-500 to-blue-500 text-white font-medium rounded-full w-10 h-10 flex items-center justify-center text-sm shadow-sm"
          >
            {{ NameInitial(user.name) }}
          </div>

          <p class="text-lg font-semibold">
            {{ formatName(user.name) }}
          </p>
        </div>

        <button
          @click="emit('toggle')"
          class="p-1 text-blue-500 hover:text-blue-700 rounded text-lg font-semibold"
        >
          ✕
        </button>
      </div>

      <div class="mt-5 mb-2">
        <p class="text-md text-center">Customer Management</p>
      </div>

      <!-- MENU TITLE -->
      <p class="px-4 pt-5 text-xs font-semibold text-slate-600 tracking-wider">
        MENU
      </p>

      <!-- Menu wrapper -->
      <nav class="flex-1 px-2 mt-4 space-y-3 overflow-y-auto">
        <!-- Dashboard -->
        <div>
          <router-link
            to="/dashboard/home"
            class="w-full flex items-center justify-between px-4 py-2 rounded-lg hover:bg-blue-50 transition"
          >
            <div class="flex items-center gap-3 text-gray-800">
              <Home class="w-5 h-5" />
              <span>Dashboard</span>
            </div>
          </router-link>
        </div>

        <!-- Customer management for all roles -->
        <div
          v-if="
            role === 'pic' ||
            role === 'staff' ||
            role === 'admin' ||
            role === 'super_admin'
          "
        >
          <button
            @click="toggleMenu('customer')"
            class="w-full flex items-center justify-between px-4 py-2 rounded-lg hover:bg-blue-50 transition"
          >
            <div class="flex items-center gap-3">
              <UserPlus class="w-5 h-5" />
              <span>Customer</span>
            </div>
            <transition name="rotate">
              <component
                :is="ChevronDown"
                :class="[
                  'w-4 h-4 text-blue-500 transition-transform duration-300',
                  openMenu.customer ? 'rotate-0' : '-rotate-90',
                ]"
              />
            </transition>
          </button>

          <transition name="slide-fade">
            <div v-if="openMenu.customer" class="ml-9 mt-2 space-y-1">
              <router-link
                to="/dashboard/new-customer"
                class="block px-3 py-2 text-gray-700 hover:bg-blue-100 rounded-lg"
              >
                New Customer
              </router-link>

              <router-link
                to="/dashboard/deal-customer"
                class="block px-3 py-2 text-gray-700 hover:bg-blue-100 rounded-lg"
              >
                Deal Customer
              </router-link>
            </div>
          </transition>
        </div>

        <!-- Management (only admin & super admin) -->
        <div v-if="role === 'admin' || role === 'super_admin'">
          <button
            @click="toggleMenu('management')"
            class="w-full flex items-center justify-between px-4 py-2 rounded-lg hover:bg-blue-50 transition"
          >
            <div class="flex items-center gap-3">
              <Users class="w-5 h-5" />
              <span>Management</span>
            </div>
            <transition name="rotate">
              <component
                :is="ChevronDown"
                :class="[
                  'w-4 h-4 text-blue-500 transition-transform duration-300',
                  openMenu.management ? 'rotate-0' : '-rotate-90',
                ]"
              />
            </transition>
          </button>

          <transition name="slide-fade">
            <div v-if="openMenu.management" class="ml-9 mt-2 space-y-1">
              <router-link
                to="/dashboard/view-data-pic"
                class="block px-3 py-2 text-gray-700 hover:bg-blue-100 rounded-lg"
              >
                View Data PIC
              </router-link>

              <router-link
                to="/dashboard/view-data-staff"
                class="block px-3 py-2 text-gray-700 hover:bg-blue-100 rounded-lg"
              >
                View Data Staff
              </router-link>

              <router-link
                v-if="role === 'super_admin'"
                to="/dashboard/view-data-admin"
                class="block px-3 py-2 text-gray-700 hover:bg-blue-100 rounded-lg"
              >
                View Data Admin
              </router-link>
            </div>
          </transition>
        </div>
      </nav>

      <!-- LOGOUT -->
      <button
        @click="handleLogout"
        class="m-4 px-4 py-2 flex items-center justify-center gap-2 text-white rounded-lg shadow-md bg-blue-500 hover:bg-blue-600"
      >
        <LogOut class="w-5 h-5" />
        Logout
      </button>
    </aside>
  </transition>
</template>

<style scoped>
/* Animasi menu nav */
.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.slide-fade-enter-to,
.slide-fade-leave-from {
  opacity: 1;
  transform: translateY(0);
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.2s ease;
}

.rotate-enter-from,
.rotate-leave-to {
  opacity: 0;
  transform: rotate(-90deg);
}

/* Animasi arrow */
.rotate-enter-to,
.rotate-leave-from {
  opacity: 1;
  transform: rotate(0deg);
}

.rotate-enter-active,
.rotate-leave-active {
  transition: all 0.3s ease;
}
</style>
