<template>
  <div class="p-4 border rounded">
    <h3 class="font-semibold mb-2">Transport List</h3>

    <!-- Input untuk cari transport -->
    <div class="flex gap-2 mb-4">
      <input
        v-model="guideInput"
        type="text"
        placeholder="Nama Guide"
        class="input"
      />
      <input
        v-model="driverInput"
        type="text"
        placeholder="Nama Driver"
        class="input"
      />
      <button @click="searchTransport" class="btn-blue">Add</button>
      <button @click="resetTransport" class="btn-gray">Reset</button>
    </div>

    <!-- Table transport -->
    <table v-if="transportList.length" class="w-full table-auto border">
      <thead>
        <tr>
          <th class="border px-2 py-1">Guide</th>
          <th class="border px-2 py-1">Driver</th>
          <th class="border px-2 py-1">HP Guide</th>
          <th class="border px-2 py-1">HP Driver</th>
          <th class="border px-2 py-1">Note Operation</th>
          <th class="border px-2 py-1">Report</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="tr in transportList" :key="tr.id">
          <td class="border px-2 py-1">{{ tr.guide ?? "-" }}</td>
          <td class="border px-2 py-1">{{ tr.driver ?? "-" }}</td>
          <td class="border px-2 py-1">{{ tr.hp_guide ?? "-" }}</td>
          <td class="border px-2 py-1">{{ tr.hp_driver ?? "-" }}</td>
          <td class="border px-2 py-1">{{ tr.note_operation ?? "-" }}</td>
          <td class="border px-2 py-1">{{ tr.report ?? "-" }}</td>
        </tr>
      </tbody>
    </table>

    <p v-else class="text-gray-500">
      Tidak ada data. Ketik nama guide atau driver dan klik Add.
    </p>
  </div>
</template>

<script setup>
import { ref } from "vue";
import api from "../api/api";

const guideInput = ref("");
const driverInput = ref("");
const transportList = ref([]);

// Cari transport dari backend berdasarkan input guide/driver
const searchTransport = async () => {
  try {
    const params = {};
    if (guideInput.value) params.guide = guideInput.value;
    if (driverInput.value) params.driver = driverInput.value;

    const res = await api.get("/transports", { params });

    // Hanya tampilkan hasil yang sesuai input
    transportList.value = res.data.data;
  } catch (err) {
    console.error(err);
  }
};

// Reset semua input dan daftar transport
const resetTransport = () => {
  guideInput.value = "";
  driverInput.value = "";
  transportList.value = [];
};
</script>

<style scoped>
.input {
  border: 1px solid #ccc;
  padding: 0.4rem 0.6rem;
  border-radius: 0.25rem;
}
.btn-blue {
  background-color: #3b82f6;
  color: white;
  padding: 0.4rem 0.8rem;
  border-radius: 0.25rem;
}
.btn-gray {
  background-color: #9ca3af;
  color: white;
  padding: 0.4rem 0.8rem;
  border-radius: 0.25rem;
}
</style>
