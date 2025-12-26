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
  const last = parts[parts.length - 1];
  return last.charAt(0).toUpperCase() + last.slice(1).toLowerCase();
}
</script>

<template>
  <header class="h-16 bg-white flex items-center px-5 gap-4">
    <button @click="emit('toggleSidebar')" class="">
      <Menu class="w-6 h-6 text-gray-700 hover:text-gray-800" />
    </button>

    <div class="flex items-center justify-center gap-2">
      <img :src="checklist" alt="Checklist" class="w-8 h-8 object-contain" />
      <p class="text-lg font-semibold text-black">Cs Management</p>
    </div>

    <p class="text-lg font-semibold text-black ml-auto text-end">
      Welcome,
      {{ lastName(user.name) }}
    </p>
  </header>
</template>
