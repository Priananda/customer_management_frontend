<script setup>
import api from "../api/api";
import { Download } from "lucide-vue-next";

const props = defineProps({
  show: Boolean,
  files: Array,
});

const emit = defineEmits(["close"]);

const API_URL = api.defaults.baseURL;

const close = () => emit("close");

const isImage = (url) => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
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
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md"
      @click.self="close"
    >
      <div
        class="bg-white w-full max-w-5xl max-h-[90vh] rounded-xl shadow-md overflow-hidden"
      >
        <div class="px-8 py-6 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-slate-900">
            All Files
            <span class="ml-2 text-sm text-slate-400">
              ({{ files.length }})
            </span>
          </h2>

          <button
            @click="close"
            class="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
          >
            ✕
          </button>
        </div>

        <div
          class="px-8 pb-8 overflow-auto overflow-y-auto hidden-scroll max-h-[calc(90vh-96px)]"
        >
          <div
            v-if="!files || files.length === 0"
            class="flex flex-col items-center justify-center py-24 text-slate-400"
          >
            <div class="text-6xl mb-4">📂</div>
            <p class="text-sm">Tidak ada file new customer yang tersedia</p>
          </div>

          <div
            v-else
            class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
          >
            <div
              v-for="file in files"
              :key="file.id"
              class="bg-slate-50 rounded-2xl p-4 hover:bg-white hover:shadow-md transition flex flex-col"
            >
              <a
                :href="file.preview_url"
                target="_blank"
                rel="noopener noreferrer"
                class="w-full h-40 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center cursor-pointer"
              >
                <img
                  v-if="isImage(file.preview_url)"
                  :src="file.preview_url"
                  class="w-full h-full object-cover"
                />

                <div
                  v-else
                  class="flex flex-col items-center justify-center text-slate-400 px-2"
                >
                  <div class="text-4xl mb-1">📄</div>
                  <p class="text-xs text-center break-all">
                    {{ file.original_name }}
                  </p>
                </div>
              </a>

              <p
                class="mt-3 text-xs text-slate-600 truncate"
                :title="file.original_name"
              >
                {{ file.original_name }}
              </p>

              <a
                :href="`${API_URL}/download-file/${file.id}`"
                target="_blank"
                rel="noopener noreferrer"
                class="mt-3 inline-flex items-center justify-center gap-2 text-sm font-medium bg-linear-to-br from-indigo-700 to-blue-700 hover:from-indigo-600 hover:to-blue-600 text-white py-2.5 rounded-lg transition"
              >
                <Download class="w-4 h-4" />
                Download
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.hidden-scroll {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.hidden-scroll::-webkit-scrollbar {
  display: none;
}

::-webkit-scrollbar {
  width: 7px;
}
::-webkit-scrollbar-thumb {
  background: #0f8fa9;
  border-radius: 5px;
}
</style>
