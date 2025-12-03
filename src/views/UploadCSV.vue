<script setup>
import { Upload, UploadCloud } from "lucide-vue-next";
import { ref } from "vue";
import api from "../api/api";
import { useAuthStore } from "../stores/auth.js";

const authStore = useAuthStore();
const file = ref(null);
const loading = ref(false);
const message = ref("");
const error = ref("");

if (authStore.accessToken) {
  api.defaults.headers.common[
    "Authorization"
  ] = `Bearer ${authStore.accessToken}`;
}

const handleUpload = (event) => {
  message.value = "";
  error.value = "";

  const selectedFile = event.target.files[0];
  if (!selectedFile) return;

  const allowedTypes = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/csv",
    "text/plain",
  ];

  if (!allowedTypes.includes(selectedFile.type)) {
    error.value = "File harus berupa Excel (.xlsx), CSV, atau TXT";
    file.value = null;
    return;
  }

  file.value = selectedFile;
};

const handleSubmit = async () => {
  if (!file.value) return;

  loading.value = true;
  error.value = "";
  message.value = "";

  const formData = new FormData();
  formData.append("file", file.value);

  try {
    const response = await api.post("/import-customer", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    message.value = response.data.message;
    file.value = null;
  } catch (err) {
    if (err.response?.data?.error) {
      error.value = err.response.data.error;
    } else {
      error.value = "Terjadi kesalahan saat upload.";
    }
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="container p-4 max-w-sm md:max-w-3xl lg:max-w-6xl mx-auto">
    <div class="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
      <h2
        class="text-2xl font-semibold mb-6 text-gray-700 flex items-center gap-2"
      >
        <Upload class="w-6 h-6 text-blue-800" />
        Upload Customer Excel / CSV
      </h2>

      <!-- Upload Box -->
      <label
        class="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-800 hover:bg-blue-50 transition cursor-pointer"
      >
        <div class="flex flex-col items-center justify-center">
          <UploadCloud class="w-10 h-10 text-blue-800 mb-2" />
          <p class="text-gray-600 font-medium">Klik untuk pilih file</p>
          <p class="text-xs text-gray-400">Format: .xlsx, .csv, .txt</p>
        </div>

        <input
          type="file"
          class="hidden"
          accept=".xlsx,.csv,.txt"
          @change="handleUpload"
        />
      </label>

      <!-- Filename -->
      <div v-if="file" class="mt-3 text-sm text-gray-700">
        <strong>File dipilih:</strong> {{ file.name }}
      </div>

      <!-- Button -->
      <button
        @click="handleSubmit"
        :disabled="!file || loading"
        class="w-full mt-5 bg-blue-800 text-white py-3 px-4 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span v-if="loading">Mengupload...</span>
        <span v-else>Upload Now</span>
      </button>

      <!-- Status messages -->
      <p v-if="message" class="mt-4 text-green-600 font-medium">
        {{ message }}
      </p>
      <p v-if="error" class="mt-4 text-red-600 font-medium">{{ error }}</p>
    </div>
  </div>
</template>
