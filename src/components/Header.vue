<script setup>
import { Menu } from "lucide-vue-next";

const props = defineProps({
  user: { type: Object, required: true },
  role: { type: String, required: true },
});

const emit = defineEmits(["toggleSidebar"]);

function formatName(name) {
  if (!name) return "";
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}
</script>

<template>
  <header class="h-16 bg-white flex items-center px-5 gap-4">
    <button @click="emit('toggleSidebar')" class="">
      <Menu class="w-6 h-6 text-blue-500 hover:text-blue-600" />
    </button>

    <p class="text-lg font-semibold">Customer Management</p>

    <p class="text-lg font-semibold ml-auto text-end">
      Welcome,
      {{ formatName(user.name) }}
    </p>
  </header>
</template>
