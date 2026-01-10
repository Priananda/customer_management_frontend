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
  <header class="h-16 bg-white flex items-center px-2 md:px-4 gap-3">
    <button @click="emit('toggleSidebar')" class="p-2 rounded-md">
      <Menu class="w-6 h-6 text-gray-700" />
    </button>

    <div class="flex items-center gap-2">
      <img
        :src="checklist"
        alt="Checklist"
        class="w-7 h-7 md:w-8 md:h-8 object-contain"
      />
      <p class="text-md md:text-lg font-semibold text-black whitespace-nowrap">
        CS Management
      </p>
    </div>

    <p
      class="ml-auto text-md md:text-lg font-semibold text-black truncate max-w-[140px] md:max-w-none"
    >
      <span class="hidden sm:inline">Welcome,</span>
      {{ lastName(props.user.name) }}
    </p>
  </header>
</template>
