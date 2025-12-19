<script setup>
import { computed, defineProps, defineEmits } from "vue";

const props = defineProps({
  currentPage: { type: Number, default: 1 },
  totalItems: { type: Number, required: true },
  pageSize: { type: Number, default: 10 },
});

const emit = defineEmits(["update:page"]);

const totalPages = computed(() => Math.ceil(props.totalItems / props.pageSize));

function prevPage() {
  if (props.currentPage > 1) {
    emit("update:page", props.currentPage - 1);
  }
}

function nextPage() {
  if (props.currentPage < totalPages.value) {
    emit("update:page", props.currentPage + 1);
  }
}
</script>

<template>
  <div class="flex items-center justify-center mt-6 text-sm gap-3">
    <button
      class="px-3 py-1 rounded shadow bg-blue-900 text-white disabled:bg-blue-300"
      :disabled="props.currentPage === 1"
      @click="prevPage"
    >
      Prev
    </button>
    <span class="text-gray-700">
      Page {{ props.currentPage }} of {{ totalPages }}
    </span>
    <button
      class="px-3 py-1 rounded shadow bg-blue-900 text-white disabled:bg-blue-300"
      :disabled="props.currentPage === totalPages"
      @click="nextPage"
    >
      Next
    </button>
  </div>
</template>
