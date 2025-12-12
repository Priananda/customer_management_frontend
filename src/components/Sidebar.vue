<script setup>
import { ref } from "vue";
import {
  Home,
  Users,
  UserPlus,
  LogOut,
  ChevronDown,
  Upload,
} from "lucide-vue-next";
import { useAuthStore } from "../stores/auth.js";

const isLoggingOut = ref(false);
const emit = defineEmits(["toggle", "loading-start"]);
const authStore = useAuthStore();
const openMenu = ref({
  customer: false,
  management: false,
  uploadcsv: false,
});

const props = defineProps({
  collapsed: Boolean,
  user: Object,
  role: String,
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

async function handleLogout() {
  emit("loading-start");

  isLoggingOut.value = true;
  try {
    await authStore.logout();
  } finally {
    isLoggingOut.value = false;
  }
}

// Additional function to close the sidebar when clicking a link
function handleLinkClick() {
  emit("toggle");
}
</script>

<template>
  <transition name="slide">
    <aside
      v-if="!collapsed"
      class="w-64 fixed top-0 left-0 bottom-0 flex flex-col z-50 shadow-xl rounded-tr-xl rounded-br-xl overflow-hidden bg-linear-to-b from-cyan-700 to-blue-900"
    >
      <!-- User Header -->
      <div
        class="p-4 flex flex-col justify-between bg-opacity-90 backdrop-blur-sm relative"
      >
        <div class="flex items-center gap-3 mb-2">
          <div
            class="bg-white text-cyan-700 font-bold rounded-full w-10 h-10 flex items-center justify-center text-sm shadow-lg"
          >
            {{ NameInitial(user.name) }}
          </div>
          <p class="text-lg font-semibold text-white">
            {{ formatName(user.name) }}
          </p>
          <p
            v-if="['pic', 'staff'].includes(role)"
            class="text-[15px] text-white/80 uppercase"
          >
            {{ role.replace("_", " ") }}
          </p>
        </div>

        <!-- Subjudul -->
        <p class="text-sm text-white/80 ml-13">Customer Management</p>

        <!-- Close button -->
        <button
          @click="emit('toggle')"
          class="absolute top-4 right-4 text-white hover:text-gray-200 text-lg font-semibold"
        >
          ✕
        </button>
      </div>

      <!-- Sidebar Menu -->
      <nav
        class="text-[15px] flex-1 mt-4 px-2 space-y-3 overflow-y-auto hidden-scroll"
      >
        <!-- Dashboard -->
        <router-link
          to="/dashboard/home"
          @click="handleLinkClick"
          class="flex items-center gap-3 px-4 py-2 rounded-lg text-white hover:bg-white/20 transition"
        >
          <Home class="w-5 h-5" />
          Dashboard
        </router-link>

        <!-- Customer Menu -->
        <div v-if="['pic', 'staff', 'admin', 'super_admin'].includes(role)">
          <button
            @click="toggleMenu('customer')"
            class="flex items-center justify-between w-full px-4 py-2 rounded-lg text-white hover:bg-white/20 transition"
          >
            <div class="flex items-center gap-3">
              <UserPlus class="w-5 h-5" /> CS Management
            </div>
            <ChevronDown
              :class="[
                'w-4 h-4 transition-transform',
                openMenu.customer ? 'rotate-0' : '-rotate-90',
              ]"
            />
          </button>
          <div v-if="openMenu.customer" class="ml-6 mt-2 space-y-1">
            <router-link
              to="/dashboard/new-customer"
              @click="handleLinkClick"
              class="block px-3 py-2 text-white hover:bg-white/20 rounded-lg transition"
            >
              New Customer
            </router-link>
            <router-link
              to="/dashboard/deal-customer"
              @click="handleLinkClick"
              class="block px-3 py-2 text-white hover:bg-white/20 rounded-lg transition"
            >
              Deal Customer
            </router-link>
          </div>
        </div>

        <!-- Management Menu -->
        <!-- <div v-if="['admin', 'super_admin'].includes(role)">
          <button
            @click="toggleMenu('management')"
            class="flex items-center justify-between w-full px-4 py-2 rounded-lg text-white hover:bg-white/20 transition"
          >
            <div class="flex items-center gap-3">
              <Users class="w-5 h-5" /> Management
            </div>
            <ChevronDown
              :class="[
                'w-4 h-4 transition-transform',
                openMenu.management ? 'rotate-0' : '-rotate-90',
              ]"
            />
          </button>
          <div v-if="openMenu.management" class="ml-6 mt-2 space-y-1">
            <router-link
              to="/dashboard/view-data-pic"
              @click="handleLinkClick"
              class="block px-3 py-2 text-white hover:bg-white/20 rounded-lg transition"
            >
              View Data PIC
            </router-link>
            <router-link
              to="/dashboard/view-data-staff"
              @click="handleLinkClick"
              class="block px-3 py-2 text-white hover:bg-white/20 rounded-lg transition"
            >
              View Data Staff
            </router-link>
            <router-link
              v-if="role === 'super_admin'"
              to="/dashboard/view-data-admin"
              @click="handleLinkClick"
              class="block px-3 py-2 text-white hover:bg-white/20 rounded-lg transition"
            >
              View Data Admin
            </router-link>
          </div>
        </div> -->

        <!-- Upload data CSV -->
        <!-- <div v-if="['pic', 'staff', 'admin', 'super_admin'].includes(role)">
          <button
            @click="toggleMenu('uploadcsv')"
            class="flex items-center justify-between w-full px-4 py-2 rounded-lg text-white hover:bg-white/20 transition"
          >
            <div class="flex items-center gap-3">
              <Upload class="w-5 h-5" /> Upload CSV
            </div>
            <ChevronDown
              :class="[
                'w-4 h-4 transition-transform',
                openMenu.uploadcsv ? 'rotate-0' : '-rotate-90',
              ]"
            />
          </button>
          <div v-if="openMenu.uploadcsv" class="ml-6 mt-2 space-y-1">
            <router-link
              to="/dashboard/upload-csv"
              @click="handleLinkClick"
              class="block px-3 py-2 text-white hover:bg-white/20 rounded-lg transition"
            >
              Upload
            </router-link>
          </div>
        </div> -->
      </nav>

      <!-- Logout -->
      <button
        @click="handleLogout"
        class="m-4 px-4 py-2 flex items-center justify-center gap-2 bg-white text-blue-900 rounded-lg shadow-lg hover:bg-white/90 transition"
      >
        <LogOut class="w-5 h-5" /> Logout
      </button>
    </aside>
  </transition>
</template>

<style scoped>
.hidden-scroll {
  overflow: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.hidden-scroll::-webkit-scrollbar {
  display: none;
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from {
  transform: translateX(-100%);
}

.slide-enter-to {
  transform: translateX(0);
}

.slide-leave-from {
  transform: translateX(0);
}

.slide-leave-to {
  transform: translateX(-100%);
}
</style>
