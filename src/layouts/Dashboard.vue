<script setup>
import { ref, computed, onMounted, watch } from "vue";
import Sidebar from "../components/Sidebar.vue";
import Header from "../components/Header.vue";
import LoadingSpinner from "../components/Loading.vue";
import { useAuthStore } from "../stores/auth";
import { useLogout } from "../composables/useLogout";

// Store auth
const auth = useAuthStore();
const user = computed(() => auth.user);
const role = computed(() => auth.role);

// Logout composable
const { logout } = useLogout();

// Sidebar collapsed state
const collapsed = ref(true);
const loading = ref(false);

// Cek status sidebar di localStorage
onMounted(() => {
  const saved = sessionStorage.getItem("sidebar-collapsed");
  collapsed.value = saved ? saved === "true" : true; // default tertutup
});

watch(collapsed, (val) => {
  sessionStorage.setItem("sidebar-collapsed", val);
});
</script>

<template>
  <div class="flex min-h-screen">
    <!-- Sidebar -->
    <Sidebar
      v-if="user"
      :user="user"
      :role="role"
      :logout="logout"
      :collapsed="collapsed"
      @toggle="collapsed = !collapsed"
      @loading-start="loading = true"
    />

    <!-- Main content -->
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

      <main class="p-0 md:p-6 lg:p-6 flex-1 overflow-auto hidden-scroll">
        <router-view />
      </main>
    </div>

    <!-- Loading spinner -->
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
