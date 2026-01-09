<script setup>
import { ref, computed } from "vue";
import { Home, UserPlus, LogOut, ChevronDown } from "lucide-vue-next";
import { useAuthStore } from "../stores/auth.js";
import checklist from "@/assets/images/checklist.png";

const authStore = useAuthStore();
const isLoggingOut = ref(false);
const emit = defineEmits(["toggle", "loading-start"]);

const openMenu = ref({
  customer: false,
});

const props = defineProps({
  collapsed: Boolean,
});

// USER & ROLES
const user = computed(() => authStore.user);
const role = computed(() => authStore.user?.role || "");
const extraRoles = computed(() => authStore.user?.extra_roles || []);

// Role checks
const isDriver = computed(() => extraRoles.value.includes("driver"));
const isAdmin = computed(() => ["admin", "super_admin"].includes(role.value));

// User info helpers
const lastName = computed(() => {
  if (!user.value?.name) return "";
  const parts = user.value.name.trim().split(" ");
  return parts[parts.length - 1];
});

const nameInitial = computed(() => {
  if (!user.value?.name) return "";
  return user.value.name
    .split(" ")
    .map((n) => n[0].toUpperCase())
    .join("");
});

// Toggle submenu
function toggleMenu(name) {
  openMenu.value[name] = !openMenu.value[name];
}

// Logout
async function handleLogout() {
  emit("loading-start");
  isLoggingOut.value = true;
  try {
    await authStore.logout();
  } finally {
    isLoggingOut.value = false;
  }
}

function handleLinkClick() {
  emit("toggle");
}
</script>

<template>
  <transition name="slide">
    <aside
      v-if="!props.collapsed"
      class="w-64 fixed top-0 left-0 bottom-0 flex flex-col z-50 shadow-xl rounded-tr-xl rounded-br-xl overflow-hidden bg-linear-to-br from-indigo-800 to-blue-800"
    >
      <!-- USER INFO -->
      <div class="p-4 relative">
        <div class="flex items-center gap-3 mt-2 mb-2">
          <div
            class="bg-white text-indigo-800 font-bold rounded-full w-10 h-10 flex items-center justify-center text-sm shadow-lg"
          >
            {{ nameInitial }}
          </div>

          <div class="flex flex-col">
            <p class="text-md font-semibold text-white">{{ lastName }}</p>
            <p v-if="extraRoles.length" class="text-xs text-white/80 uppercase">
              {{ extraRoles.join(" / ") }}
            </p>
            <p v-else class="text-xs text-white/80 uppercase">
              {{ role.replace("_", " ") }}
            </p>
          </div>
        </div>

        <div class="mt-6 flex items-center justify-center gap-2">
          <img
            :src="checklist"
            alt="Checklist"
            class="w-8 h-8 object-contain"
          />
          <p class="text-sm text-white/80">Customer Management</p>
        </div>

        <!-- X button muncul untuk semua role -->
        <button
          @click="emit('toggle')"
          class="absolute top-4 right-4 text-white hover:text-gray-200"
        >
          ✕
        </button>
      </div>

      <!-- NAVIGATION -->
      <nav
        class="text-[15px] flex-1 px-2 mt-4 space-y-3 overflow-y-auto hidden-scroll"
      >
        <!-- DRIVER MENU -->
        <template v-if="isDriver">
          <router-link
            to="/dashboard/driver"
            @click="handleLinkClick"
            class="flex items-center gap-3 px-4 py-2 rounded-lg text-white hover:bg-white/20 transition"
          >
            <Home class="w-5 h-5" />
            Listing Driver
          </router-link>
        </template>

        <!-- ADMIN MENU -->
        <template v-if="isAdmin">
          <router-link
            to="/dashboard/home"
            @click="handleLinkClick"
            class="flex items-center gap-3 px-4 py-2 rounded-lg text-white hover:bg-white/20 transition"
          >
            <Home class="w-5 h-5" />
            Dashboard
          </router-link>

          <button
            @click="toggleMenu('customer')"
            class="flex items-center justify-between w-full px-4 py-2 rounded-lg text-white hover:bg-white/20"
          >
            <div class="flex items-center gap-3">
              <UserPlus class="w-5 h-5" />
              CS Management
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
              class="block px-3 py-2 text-white hover:bg-white/20 rounded-lg"
            >
              New Customer
            </router-link>
            <router-link
              to="/dashboard/deal-customer"
              @click="handleLinkClick"
              class="block px-3 py-2 text-white hover:bg-white/20 rounded-lg"
            >
              Deal Customer
            </router-link>
            <router-link
              to="/dashboard/laporan-driver"
              @click="handleLinkClick"
              class="block px-3 py-2 text-white hover:bg-white/20 rounded-lg"
            >
              Laporan Driver
            </router-link>
          </div>
        </template>
      </nav>

      <!-- LOGOUT -->
      <button
        @click="handleLogout"
        class="m-4 px-4 py-2 flex items-center justify-center gap-2 bg-white text-blue-800 rounded-lg shadow hover:bg-white/90"
      >
        <LogOut class="w-5 h-5" />
        Logout
      </button>
    </aside>
  </transition>
</template>

<style scoped>
.hidden-scroll {
  overflow: auto;
  scrollbar-width: none;
}
.hidden-scroll::-webkit-scrollbar {
  display: none;
}
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(-100%);
}
</style>

<!-- <script setup>
import { ref, computed } from "vue";
import { Home, UserPlus, LogOut, ChevronDown } from "lucide-vue-next";
import { useAuthStore } from "../stores/auth.js";
import checklist from "@/assets/images/checklist.png";

const authStore = useAuthStore();
const isLoggingOut = ref(false);

const emit = defineEmits(["toggle", "loading-start"]);

const openMenu = ref({
  customer: false,
  management: false,
  uploadcsv: false,
});

const props = defineProps({
  collapsed: Boolean,
});

const user = computed(() => authStore.user);
const role = computed(() => authStore.user?.role || "");

const lastName = computed(() => {
  if (!user.value?.name) return "";
  const parts = user.value.name.trim().split(" ");
  return parts[parts.length - 1];
});

const nameInitial = computed(() => {
  if (!user.value?.name) return "";
  return user.value.name
    .split(" ")
    .map((n) => n[0].toUpperCase())
    .join("");
});

function toggleMenu(name) {
  openMenu.value[name] = !openMenu.value[name];
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

function handleLinkClick() {
  emit("toggle");
}
</script>

<template>
  <transition name="slide">
    <aside
      v-if="!props.collapsed"
      class="w-64 fixed top-0 left-0 bottom-0 flex flex-col z-50 shadow-xl rounded-tr-xl rounded-br-xl overflow-hidden bg-linear-to-br from-indigo-800 to-blue-800"
    >
      <div class="p-4 relative">
        <div class="flex items-center gap-3 mt-2 mb-2">
          <div
            class="bg-white text-indigo-800 font-bold rounded-full w-10 h-10 flex items-center justify-center text-sm shadow-lg"
          >
            {{ nameInitial }}
          </div>

          <div class="flex flex-col">
            <p class="text-md font-semibold text-white">
              {{ lastName }}
            </p>
            <p
              v-if="['pic', 'staff', 'admin', 'super_admin'].includes(role)"
              class="text-xs text-white/80 uppercase"
            >
              {{ role.replace("_", " ") }}
            </p>
          </div>
        </div>

        <div class="mt-6 flex items-center justify-center gap-2">
          <img
            :src="checklist"
            alt="Checklist"
            class="w-8 h-8 object-contain"
          />
          <p class="text-sm text-white/80">Customer Management</p>
        </div>

        <button
          @click="emit('toggle')"
          class="absolute top-4 right-4 text-white hover:text-gray-200"
        >
          ✕
        </button>
      </div>

      <nav
        class="text-[15px] flex-1 px-2 mt-4 space-y-3 overflow-y-auto hidden-scroll"
      >
        <router-link
          to="/dashboard/home"
          @click="handleLinkClick"
          class="flex items-center gap-3 px-4 py-2 rounded-lg text-white hover:bg-white/20 transition"
        >
          <Home class="w-5 h-5" />
          Dashboard
        </router-link>

        <div v-if="['pic', 'staff', 'admin', 'super_admin'].includes(role)">
          <button
            @click="toggleMenu('customer')"
            class="flex items-center justify-between w-full px-4 py-2 rounded-lg text-white hover:bg-white/20"
          >
            <div class="flex items-center gap-3">
              <UserPlus class="w-5 h-5" />
              CS Management
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
              class="block px-3 py-2 text-white hover:bg-white/20 rounded-lg"
            >
              New Customer
            </router-link>
            <router-link
              to="/dashboard/deal-customer"
              @click="handleLinkClick"
              class="block px-3 py-2 text-white hover:bg-white/20 rounded-lg"
            >
              Deal Customer
            </router-link>
          </div>
        </div>
      </nav>

      <button
        @click="handleLogout"
        class="m-4 px-4 py-2 flex items-center justify-center gap-2 bg-white text-blue-800 rounded-lg shadow hover:bg-white/90"
      >
        <LogOut class="w-5 h-5" />
        Logout
      </button>
    </aside>
  </transition>
</template>

<style scoped>
.hidden-scroll {
  overflow: auto;
  scrollbar-width: none;
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
.slide-leave-to {
  transform: translateX(-100%);
}
</style> -->
