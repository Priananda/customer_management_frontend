<script setup>
const props = defineProps({
  show: Boolean,
  title: { type: String, default: "Konfirmasi" },
  message: { type: String, default: "Apakah Anda yakin?" },
  cancelText: { type: String, default: "Tidak" },
  confirmText: { type: String, default: "Ya" },
  loading: { type: Boolean, default: false },
});

defineEmits(["confirm", "cancel"]);
</script>

<template>
  <Transition name="fade">
    <div
      v-if="show"
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
    >
      <Transition name="zoom">
        <div v-if="show" class="bg-white p-6 rounded-lg shadow-lg w-[350px]">
          <h2 class="text-lg font-semibold text-slate-800 mb-2">
            {{ title }}
          </h2>

          <p class="text-slate-600 mb-5">
            {{ message }}
          </p>

          <div class="flex justify-end gap-3">
            <!-- Cancel -->
            <button
              @click="$emit('cancel')"
              :disabled="props.loading"
              class="px-4 py-2 rounded-md border border-blue-900 text-black hover:bg-slate-100 disabled:opacity-50"
            >
              {{ cancelText }}
            </button>

            <button
              @click="$emit('confirm')"
              :disabled="props.loading"
              class="px-4 py-2 rounded-md bg-blue-900 text-white hover:bg-blue-900/90 disabled:opacity-50 flex items-center gap-2"
            >
              <svg
                v-if="props.loading"
                class="w-5 h-5 animate-spin text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                ></path>
              </svg>

              <span>
                {{ props.loading ? "Memproses..." : confirmText }}
              </span>
            </button>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.zoom-enter-active,
.zoom-leave-active {
  transition: transform 0.25s ease, opacity 0.25s ease;
}

.zoom-enter-from {
  opacity: 0;
  transform: scale(0.85);
}

.zoom-enter-to {
  opacity: 1;
  transform: scale(1);
}

.zoom-leave-from {
  opacity: 1;
  transform: scale(1);
}

.zoom-leave-to {
  opacity: 0;
  transform: scale(0.85);
}
</style>
