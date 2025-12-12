<script setup>
import api from "../api/api"; // pakai API ts kamu

const props = defineProps({
  show: Boolean,
  files: Array,
});

const emit = defineEmits(["close"]);

const API_URL = api.defaults.baseURL;

const close = () => emit("close");
const isImage = (url) => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
const isPDF = (url) => /\.pdf$/i.test(url);
</script>

<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
  >
    <div
      class="bg-white rounded-xl p-5 w-full max-w-4xl max-h-[90vh] overflow-auto shadow-lg"
    >
      <!-- HEADER -->
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold text-gray-800">Preview File</h2>
        <button @click="close" class="text-gray-600 hover:text-black">✕</button>
      </div>

      <!-- GRID -->
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        <!-- LOOP FILE -->
        <div
          v-for="file in files"
          :key="file.id"
          class="border rounded-lg p-3 shadow-sm flex flex-col items-center"
        >
          <!-- PREVIEW -->
          <div
            class="w-full h-40 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden"
          >
            <!-- IMAGE -->
            <img
              v-if="isImage(file.preview_url)"
              :src="file.preview_url"
              class="w-full h-full object-cover"
            />

            <!-- PDF -->
            <iframe
              v-else-if="isPDF(file.preview_url)"
              :src="file.preview_url"
              class="w-full h-full"
            ></iframe>

            <!-- OTHER FILE TYPES -->
            <div
              v-else
              class="text-center text-gray-500 flex flex-col items-center"
            >
              <div class="text-5xl">📄</div>
              <p class="text-sm mt-2 break-all">{{ file.original_name }}</p>
            </div>
          </div>

          <a
            :href="`${API_URL}/download-file/${file.id}`"
            class="mt-3 w-full bg-cyan-700 text-white py-2 text-center rounded-md hover:bg-cyan-800"
          >
            Download
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
::-webkit-scrollbar {
  width: 7px;
}
::-webkit-scrollbar-thumb {
  background: #0f8fa9;
  border-radius: 5px;
}
</style>
