<script setup>
import { ref, computed, watch } from "vue";
import api from "../api/api";
import { RotateCcw, Eye } from "lucide-vue-next";

/* ================= STATE ================= */
const guideInput = ref("");
const driverInput = ref("");
const transportList = ref([]);
const isTableVisible = ref(false);
const isLoading = ref(false);
const alertMessage = ref("");

/* ================= PAGINATION ================= */
const currentPage = ref(1);
const pageSize = 5;

const totalPages = computed(() =>
  Math.ceil(transportList.value.length / pageSize)
);

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return transportList.value.slice(start, start + pageSize);
});

/* ================= ALERT ================= */
const showAlert = (msg, duration = 3000) => {
  alertMessage.value = msg;
  setTimeout(() => {
    alertMessage.value = "";
  }, duration);
};

/* ================= API ================= */
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
    console.error(err);
    showAlert("Gagal mengambil data transport");
  } finally {
    isLoading.value = false;
  }
};

/* ================= ACTION ================= */
const toggleTable = async () => {
  isTableVisible.value = !isTableVisible.value;

  if (isTableVisible.value) {
    await fetchTransport();
  }
};

const resetTransport = () => {
  guideInput.value = "";
  driverInput.value = "";
  transportList.value = [];
  currentPage.value = 1;
  isTableVisible.value = false;
};

/* ================= AUTO SEARCH ================= */
let searchTimeout;
watch([guideInput, driverInput], () => {
  if (!isTableVisible.value) return;

  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    fetchTransport();
  }, 400);
});

/* ================= PAGINATION ================= */
const prevPage = () => {
  if (currentPage.value > 1) currentPage.value--;
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++;
};
</script>

<template>
  <div
    class="max-w-6xl mx-auto mt-12 p-6 bg-white rounded-2xl border border-slate-200"
  >
    <h2 class="text-xl font-bold text-slate-800 mb-4">Transport Search</h2>

    <!-- ALERT -->
    <div
      v-if="alertMessage"
      class="mb-5 p-3 rounded-lg bg-red-100 border border-red-400 text-red-700 text-sm"
    >
      {{ alertMessage }}
    </div>

    <!-- SEARCH FORM -->
    <div class="flex flex-col md:flex-row gap-3 mb-6 items-center">
      <input
        v-model="guideInput"
        type="text"
        placeholder="Cari Nama Guide..."
        class="flex-1 border border-slate-300 rounded-lg px-4 py-2 focus:outline-none placeholder:text-sm"
      />
      <input
        v-model="driverInput"
        type="text"
        placeholder="Cari Nama Driver..."
        class="flex-1 border border-slate-300 rounded-lg px-4 py-2 focus:outline-none placeholder:text-sm"
      />

      <button
        @click="resetTransport"
        class="flex items-center gap-2 px-5 py-2 bg-slate-200 text-slate-800 text-sm font-medium rounded-lg hover:bg-slate-300 transition"
      >
        <RotateCcw class="w-5 h-5" />
        Reset
      </button>

      <button
        @click="toggleTable"
        class="flex items-center gap-2 px-5 py-2 bg-slate-700 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition"
      >
        <Eye class="w-5 h-5" />
        {{ isTableVisible ? "Hide" : "View" }}
      </button>
    </div>

    <!-- TABLE -->
    <div v-if="isTableVisible" class="overflow-x-auto">
      <!-- LOADING -->
      <div v-if="isLoading" class="flex justify-center py-10">
        <div
          class="w-8 h-8 border-4 border-slate-300 border-t-slate-800 rounded-full animate-spin"
        ></div>
      </div>

      <!-- DATA -->
      <table
        v-else-if="transportList.length"
        class="min-w-full bg-white rounded-xl overflow-hidden shadow-sm divide-y divide-slate-200"
      >
        <thead class="bg-slate-100">
          <tr>
            <th class="px-4 py-3 text-left text-sm font-semibold">No</th>
            <th class="px-4 py-3 text-left text-sm font-semibold">Guide</th>
            <th class="px-4 py-3 text-left text-sm font-semibold">Driver</th>
            <th class="px-4 py-3 text-left text-sm font-semibold">HP Guide</th>
            <th class="px-4 py-3 text-left text-sm font-semibold">HP Driver</th>
            <th class="px-4 py-3 text-left text-sm font-semibold">Note</th>
            <th class="px-4 py-3 text-left text-sm font-semibold">Report</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200 text-sm">
          <tr
            v-for="(tr, index) in paginatedData"
            :key="tr.id"
            class="hover:bg-slate-50 transition"
          >
            <td class="px-4 py-2">{{ index + 1 }}</td>
            <td class="px-4 py-2">{{ tr.guide ?? "-" }}</td>
            <td class="px-4 py-2">{{ tr.driver ?? "-" }}</td>
            <td class="px-4 py-2">{{ tr.hp_guide ?? "-" }}</td>
            <td class="px-4 py-2">{{ tr.hp_driver ?? "-" }}</td>
            <td class="px-4 py-2">{{ tr.note_operation ?? "-" }}</td>
            <td class="px-4 py-2">{{ tr.report ?? "-" }}</td>
          </tr>
        </tbody>
      </table>

      <!-- EMPTY -->
      <p v-else class="text-center text-sm text-slate-500 py-8">
        Data tidak ditemukan
      </p>
    </div>

    <!-- PAGINATION -->
    <div
      v-if="transportList.length"
      class="flex justify-center items-center gap-3 mt-5"
    >
      <button
        @click="prevPage"
        :disabled="currentPage === 1"
        class="px-3 py-1 bg-slate-200 rounded-md text-sm hover:bg-slate-300 disabled:opacity-40"
      >
        Prev
      </button>

      <span class="text-sm text-slate-600">
        Page {{ currentPage }} of {{ totalPages }}
      </span>

      <button
        @click="nextPage"
        :disabled="currentPage === totalPages"
        class="px-3 py-1 bg-slate-200 rounded-md text-sm hover:bg-slate-300 disabled:opacity-40"
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
</style>
