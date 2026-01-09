<script setup>
import { ref, computed, watch } from "vue";
import api from "../api/api";
import { RotateCcw, Eye } from "lucide-vue-next";
import PersonalData1 from "@/assets/images/personal-data1.png";

const guideInput = ref("");
const driverInput = ref("");
const transportList = ref([]);
const isTableVisible = ref(false);
const isLoading = ref(false);
const alertMessage = ref("");

const isRotating = ref(false);
const isBlinking = ref(false);

const currentPage = ref(1);
const pageSize = 5;
const totalPages = computed(() =>
  Math.ceil(transportList.value.length / pageSize)
);

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return transportList.value.slice(start, start + pageSize);
});

const showAlert = (msg, duration = 3000) => {
  alertMessage.value = msg;
  setTimeout(() => {
    alertMessage.value = "";
  }, duration);
};

const fetchTransport = async () => {
  try {
    isLoading.value = true;

    const params = {};
    if (guideInput.value) params.guide = guideInput.value;
    if (driverInput.value) params.driver = driverInput.value;

    const res = await api.get("/transports", { params });
    transportList.value = res.data.data || [];
    currentPage.value = 1;
  } catch (err) {
    showAlert("Gagal mengambil data transport");
  } finally {
    isLoading.value = false;
  }
};

const toggleTable = async () => {
  isBlinking.value = true;
  setTimeout(() => (isBlinking.value = false), 600);

  isTableVisible.value = !isTableVisible.value;
  if (isTableVisible.value) {
    await fetchTransport();
  }
};

const resetTransport = () => {
  isRotating.value = true;
  setTimeout(() => (isRotating.value = false), 600);

  guideInput.value = "";
  driverInput.value = "";
  transportList.value = [];
  currentPage.value = 1;
  isTableVisible.value = false;
};

let searchTimeout;
watch([guideInput, driverInput], () => {
  if (!isTableVisible.value) return;

  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    fetchTransport();
  }, 400);
});

const prevPage = () => {
  if (currentPage.value > 1) currentPage.value--;
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++;
};
</script>

<template>
  <div class="mx-auto mt-12 p-5 bg-white rounded-lg border border-slate-200">
    <div class="flex items-center gap-4 mb-5">
      <img
        :src="PersonalData1"
        alt="Personal Data1"
        class="w-14 h-14 object-contain"
      />
      <div>
        <h2 class="text-xl font-semibold text-slate-800 mb-1">
          Transport Search
        </h2>
        <p class="text-sm text-slate-500">Manage customer transports</p>
      </div>
    </div>

    <div
      v-if="alertMessage"
      class="mb-5 p-3 rounded-lg bg-red-50 border border-red-300 text-red-700 text-sm"
    >
      {{ alertMessage }}
    </div>

    <div class="flex flex-col md:flex-row gap-3 mb-6 items-center">
      <input
        v-model="guideInput"
        type="text"
        placeholder="Cari Nama Guide..."
        class="flex-1 border border-slate-300 rounded-lg px-4 py-1 focus:outline-none placeholder:text-sm"
      />
      <input
        v-model="driverInput"
        type="text"
        placeholder="Cari Nama Driver..."
        class="flex-1 border border-slate-300 rounded-lg px-4 py-1 focus:outline-none placeholder:text-sm"
      />

      <button
        @click="resetTransport"
        class="flex items-center gap-2 px-5 py-2 bg-indigo-700 text-white text-sm font-medium rounded-lg hover:bg-indigo-800 shadow-md transition"
      >
        <RotateCcw
          class="w-4 h-4 transition-transform text-white"
          :class="{ 'rotate-animation': isRotating }"
        />
        Reset
      </button>

      <button
        @click="toggleTable"
        class="flex items-center gap-2 px-5 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800 shadow-md transition"
      >
        <Eye
          class="w-4 h-4 transition-opacity text-white"
          :class="{ 'blink-animation': isBlinking }"
        />
        {{ isTableVisible ? "Hide" : "View" }}
      </button>
    </div>

    <div v-if="isTableVisible" class="overflow-x-auto">
      <div v-if="isLoading" class="flex justify-center py-10">
        <div class="flex justify-center items-center gap-3">
          <div
            class="w-8 h-8 border-4 border-gray-300 border-t-indigo-600 rounded-full animate-spin"
          ></div>
          <span class="text-sm text-gray-500">Loading data...</span>
        </div>
      </div>

      <table
        v-else-if="transportList.length"
        class="min-w-full bg-white rounded-md overflow-hidden divide-y divide-indigo-100"
      >
        <thead class="bg-indigo-700 text-white sticky top-0 z-10">
          <tr>
            <th class="px-4 py-2 text-left text-sm font-semibold">No</th>
            <th class="px-4 py-2 text-left text-sm font-semibold">Guide</th>
            <th class="px-4 py-2 text-left text-sm font-semibold">Driver</th>
            <th class="px-4 py-2 text-left text-sm font-semibold">HP Guide</th>
            <th class="px-4 py-2 text-left text-sm font-semibold">HP Driver</th>
            <th class="px-4 py-2 text-left text-sm font-semibold">Note</th>
            <th class="px-4 py-2 text-left text-sm font-semibold">Report</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200 text-sm">
          <tr
            v-for="(tr, index) in paginatedData"
            :key="tr.id"
            class="hover:bg-slate-50 transition"
          >
            <td class="px-4 py-2">
              {{ (currentPage - 1) * pageSize + index + 1 }}
            </td>

            <td class="px-4 py-2">{{ tr.guide ?? "-" }}</td>
            <td class="px-4 py-2">{{ tr.driver ?? "-" }}</td>
            <td class="px-4 py-2">{{ tr.hp_guide ?? "-" }}</td>
            <td class="px-4 py-2">{{ tr.hp_driver ?? "-" }}</td>
            <td class="px-4 py-2">{{ tr.note_operation ?? "-" }}</td>
            <td class="px-4 py-2">{{ tr.report ?? "-" }}</td>
          </tr>
        </tbody>
      </table>

      <p v-else class="text-center text-sm text-slate-500 py-8">
        Data not found
      </p>
    </div>

    <div
      v-if="isTableVisible && transportList.length"
      class="flex justify-center items-center gap-3 mt-5"
    >
      <button
        @click="prevPage"
        :disabled="currentPage === 1"
        class="px-3 py-1 text-sm rounded-sm bg-indigo-600 text-white border border-indigo-700 hover:bg-indigo-800 transition disabled:bg-indigo-300 disabled:border-indigo-300"
      >
        Prev
      </button>

      <span class="text-sm text-slate-600">
        Page {{ currentPage }} of {{ totalPages }}
      </span>

      <button
        @click="nextPage"
        :disabled="currentPage === totalPages"
        class="px-3 py-1 text-sm rounded-sm bg-indigo-600 text-white border border-indigo-700 hover:bg-indigo-800 transition disabled:bg-indigo-300 disabled:border-indigo-300"
      >
        Next
      </button>
    </div>
  </div>
</template>

<style scoped>
::-webkit-scrollbar {
  display: none;
}

@keyframes rotateAnim {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
.rotate-animation {
  animation: rotateAnim 0.6s ease-in-out;
}

@keyframes blinkAnim {
  0%,
  50%,
  100% {
    opacity: 1;
  }
  25%,
  75% {
    opacity: 0;
  }
}
.blink-animation {
  animation: blinkAnim 0.6s ease-in-out;
}
</style>
