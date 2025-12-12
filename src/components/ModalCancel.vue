<script setup>
const props = defineProps({
  show: Boolean,
});

const emit = defineEmits(["close", "confirm"]);
</script>

<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
  >
    <div class="bg-white rounded-lg w-[360px] p-6 shadow-xl">
      <h2 class="text-lg font-semibold text-gray-800 mb-2">Batalkan Deal?</h2>
      <p class="text-sm text-gray-600 mb-6 leading-relaxed">
        Data deal customer akan hilang dari halaman deal, namun tetap tersimpan
        di halaman new customer.
      </p>

      <div class="flex justify-end space-x-3">
        <button
          @click="emit('close')"
          class="px-4 py-2 rounded border border-gray-300 bg-white hover:bg-gray-100"
        >
          Batal
        </button>

        <button
          @click="emit('confirm')"
          class="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
        >
          Ya, Cancel
        </button>
      </div>
    </div>
  </div>
</template>
