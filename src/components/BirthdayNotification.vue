<script setup>
import { ref, watch } from "vue";

const props = defineProps({
  show: { type: Boolean, default: true },
  customers: { type: Array, default: () => [] },
});

const visible = ref(false);

// key unik per hari (yyyy-mm-dd)
const todayKey = `birthday-notification-${new Date()
  .toISOString()
  .slice(0, 10)}`;

watch(
  () => props.customers,
  (customers) => {
    if (!props.show) return;
    if (!customers || customers.length === 0) return;

    // sudah pernah muncul di session ini hari ini
    if (sessionStorage.getItem(todayKey)) return;

    visible.value = true;
    sessionStorage.setItem(todayKey, "shown");
  },
  { immediate: true }
);
</script>

<template>
  <Transition name="slide-up">
    <div
      v-if="show && visible"
      class="fixed z-50 bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:w-96 max-w-md mx-auto rounded-xl bg-gradient-to-br from-pink-50 to-purple-50 border border-pink-200 shadow-xl p-4 space-y-3"
    >
      <!-- Header -->
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center"
        >
          🎉
        </div>

        <div>
          <h3 class="font-semibold text-pink-700">Birthday Notification</h3>
          <p class="text-xs text-pink-500">
            Hari ini ada customer yang ulang tahun 🎂
          </p>
        </div>
      </div>

      <!-- Content -->
      <div class="space-y-1">
        <div v-for="c in customers" :key="c.id" class="text-sm text-pink-800">
          🎈 Hallo
          <span class="font-semibold">
            {{ c.deal_customer?.new_customer?.name }} </span
          >, berulang tahun hari ini!
        </div>
      </div>

      <!-- Footer -->
      <div class="pt-2 border-t border-pink-200 text-right">
        <button
          @click="visible = false"
          class="text-xs text-pink-600 hover:text-pink-800"
        >
          Tutup
        </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.slide-up-enter-active {
  transition: all 0.4s ease-out;
}
.slide-up-leave-active {
  transition: all 0.3s ease-in;
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(120%);
  opacity: 0;
}
.slide-up-enter-to,
.slide-up-leave-from {
  transform: translateY(0);
  opacity: 1;
}
</style>
