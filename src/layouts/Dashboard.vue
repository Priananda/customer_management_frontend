<!-- AdminDashboard.vue -->
<script setup>
import { ref, computed } from "vue";
import Sidebar from "../components/Sidebar.vue";
import Header from "../components/Header.vue";
import LoadingSpinner from "../components/Loading.vue";
import { useAuthStore } from "../stores/auth";
import { useLogout } from "../composables/useLogout";

// Ambil store auth
const auth = useAuthStore();

// Reactive user dan role dari Pinia store
const user = computed(() => auth.user);
const role = computed(() => auth.role);

// Logout
const { logout } = useLogout();

// Sidebar collapsed state
const collapsed = ref(false);
const loading = ref(false);
</script>

<template>
  <div class="flex min-h-screen bg-gray-50">
    <!-- SIDEBAR -->
    <Sidebar
      v-if="user"
      :user="user"
      :role="role"
      :logout="logout"
      :collapsed="collapsed"
      @toggle="collapsed = !collapsed"
      @loading-start="loading = true"
    />

    <!-- MAIN CONTENT -->
    <div
      class="flex-1 flex flex-col transition-all duration-300"
      :class="collapsed ? 'ml-0' : 'ml-64'"
    >
      <Header
        v-if="user"
        :user="user"
        :role="role"
        @toggleSidebar="collapsed = !collapsed"
      />
      <main class="p-6 flex-1 overflow-auto hidden-scroll">
        <router-view />
      </main>
    </div>

    <!-- Loading Spinner -->
    <LoadingSpinner v-if="loading" />
  </div>
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
</style>
