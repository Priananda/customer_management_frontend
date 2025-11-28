<script setup>
import { ref } from "vue";
import Sidebar from "../components/Sidebar.vue";
import Header from "../components/Header.vue";
import { useLogout } from "../composables/useLogout";
import LoadingSpinner from "../components/Loading.vue";
const user = JSON.parse(localStorage.getItem("user") || "{}");
const role = user.role;
const { logout, role: logoutRole } = useLogout();
const collapsed = ref(false);
const loading = ref(false);
</script>

<template>
  <div class="flex h-screen">
    <!-- SIDEBAR -->
    <Sidebar
      :user="user"
      :role="role"
      :logout="logout"
      :logoutRole="logoutRole"
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
        :user="user"
        :role="role"
        @toggleSidebar="collapsed = !collapsed"
      />
      <main class="p-5 flex-1 overflow-auto"><router-view /></main>
    </div>
  </div>

  <LoadingSpinner v-if="loading" />
</template>
