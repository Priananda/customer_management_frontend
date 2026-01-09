<script setup>
import { Menu } from "lucide-vue-next";
import checklist from "@/assets/images/checklist.png";

const props = defineProps({
  user: { type: Object, required: true },
  role: { type: String, required: true },
});

const emit = defineEmits(["toggleSidebar"]);

function lastName(name) {
  if (!name) return "";
  const parts = name.trim().split(" ");
  return parts[parts.length - 1] || "";
}
</script>

<template>
  <header class="h-16 bg-white flex items-center px-5 gap-4 shadow">
    <!-- Hamburger toggle -->
    <button
      @click="emit('toggleSidebar')"
      class="p-2 rounded hover:bg-gray-100"
    >
      <Menu class="w-6 h-6 text-gray-700" />
    </button>

    <!-- Brand / logo -->
    <div class="flex items-center justify-center gap-2">
      <img :src="checklist" alt="Checklist" class="w-8 h-8 object-contain" />
      <p class="text-lg font-semibold text-black">CS Management</p>
    </div>

    <!-- User info -->
    <p class="ml-auto text-lg font-semibold text-black">
      Welcome, {{ lastName(props.user.name) }}
    </p>
  </header>
</template>

<style scoped>
/* Optional styling */
</style>
