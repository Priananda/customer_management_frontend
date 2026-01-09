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
  <Transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="opacity-0 scale-95"
    enter-to-class="opacity-100 scale-100"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="opacity-100 scale-100"
    leave-to-class="opacity-0 scale-95"
  >
    <div
      v-if="show"
      class="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50"
    >
      <Transition name="zoom">
        <div v-if="show" class="bg-white p-6 rounded-xl shadow-md w-[360px]">
          <h2 class="text-lg font-semibold text-slate-800 mb-2">
            {{ title }}
          </h2>

          <p class="text-slate-600 text-sm leading-relaxed mb-6">
            {{ message }}
          </p>

          <div class="flex justify-end gap-3">
            <button
              @click="$emit('cancel')"
              :disabled="props.loading"
              class="px-4 py-2 rounded-md bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition cursor-pointer"
            >
              {{ cancelText }}
            </button>

            <button
              @click="$emit('confirm')"
              :disabled="props.loading"
              class="px-5 py-2 rounded-md bg-linear-to-r bg-slate-800 hover:bg-slate-700 text-white font-medium shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              <svg
                v-if="props.loading"
                class="w-4 h-4 animate-spin text-white"
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
                />
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
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
