<script setup>
import { ref, onMounted, computed } from "vue";
import api from "../api/api";

// Data
const dataStaff = ref([]);
const loading = ref(true);

// Filter & Search state
const searchKeyword = ref("");
const filterDate = ref("");
const filterProgress = ref("all");
const selectedSegmen = ref("all");

// Load data
onMounted(async () => {
  try {
    const res = await api.get("/new-customer");
    dataStaff.value = res.data.data;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
});

// Filtered data
const filteredStaff = computed(() => {
  return dataStaff.value.filter((c) => {
    const keyword = searchKeyword.value.toLowerCase();
    const matchesKeyword =
      c.date.toLowerCase().includes(keyword) ||
      c.phone.toLowerCase().includes(keyword) ||
      c.name.toLowerCase().includes(keyword) ||
      c.progress.toLowerCase().includes(keyword) ||
      c.pic.toLowerCase().includes(keyword) ||
      c.segmen.toLowerCase().includes(keyword) ||
      c.via.toLowerCase().includes(keyword) ||
      c.country.toLowerCase().includes(keyword) ||
      c.social_media_id.toLowerCase().includes(keyword) ||
      c.tour_packages.toLowerCase().includes(keyword) ||
      c.check_in.toLowerCase().includes(keyword) ||
      c.check_out.toLowerCase().includes(keyword) ||
      c.hotel.toLowerCase().includes(keyword) ||
      c.notes.toLowerCase().includes(keyword);

    const matchesDate = filterDate.value ? c.date === filterDate.value : true;

    const matchesProgress =
      filterProgress.value && filterProgress.value !== "all"
        ? c.progress.toLowerCase() === filterProgress.value.toLowerCase()
        : true;

    const matchesSegmen =
      selectedSegmen.value && selectedSegmen.value !== "all"
        ? c.segmen.toLowerCase() === selectedSegmen.value.toLowerCase()
        : true;

    return matchesKeyword && matchesDate && matchesProgress && matchesSegmen;
  });
});

// Unique Segmen untuk filter
const uniqueSegmens = computed(() => {
  const segmens = new Set();
  dataStaff.value.forEach((c) => {
    if (c.segmen) segmens.add(c.segmen);
  });
  return Array.from(segmens);
});

// Download CSV
const downloadCSV = () => {
  const headers = [
    "Date",
    "Phone",
    "Name",
    "Progress",
    "PIC",
    "Segmen",
    "Via",
    "Country",
    "Social Media ID",
    "Tour Packages",
    "Check In",
    "Check Out",
    "Hotel",
    "Notes",
  ];

  const rows = filteredStaff.value.map((c) => [
    c.date,
    c.phone,
    c.name,
    c.progress,
    c.pic,
    c.segmen,
    c.via,
    c.country,
    c.social_media_id,
    c.tour_packages,
    c.check_in,
    c.check_out,
    c.hotel,
    c.notes,
  ]);

  const csvContent =
    "data:text/csv;charset=utf-8," +
    [headers, ...rows].map((e) => e.join(",")).join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "data_staff.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Reset filters
const resetFilters = () => {
  searchKeyword.value = "";
  filterDate.value = "";
  filterProgress.value = "all";
  selectedSegmen.value = "all";
};
</script>

<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold mb-4">Data Staff</h1>

    <!-- Search & Filters -->
    <div class="mb-4 flex flex-wrap gap-2 items-end">
      <input
        v-model="searchKeyword"
        type="text"
        placeholder="Search..."
        class="input"
      />
      <input v-model="filterDate" type="date" class="input" />
      <select v-model="filterProgress" class="input">
        <option value="all">All Progress</option>
        <option value="on progress">On Progress</option>
        <option value="deal">Deal</option>
        <option value="canceled">Canceled</option>
      </select>
      <select v-model="selectedSegmen" class="input">
        <option value="all">All Segmen</option>
        <option
          v-for="segment in uniqueSegmens"
          :key="segment"
          :value="segment"
        >
          {{ segment }}
        </option>
      </select>

      <button
        @click="downloadCSV"
        class="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded"
      >
        Download CSV
      </button>
      <button
        @click="resetFilters"
        class="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded"
      >
        Reset Filters
      </button>
    </div>

    <!-- Table -->
    <div v-if="loading">Loading...</div>
    <table v-else class="w-full border text-sm">
      <thead>
        <tr class="bg-gray-200">
          <th class="p-2 border">NO</th>
          <th class="p-2 border">Date</th>
          <th class="p-2 border">Name</th>
          <th class="p-2 border">Phone</th>
          <th class="p-2 border">PIC</th>
          <th class="p-2 border">Progress</th>
          <th class="p-2 border">Segmen</th>
          <th class="p-2 border">Via</th>
          <th class="p-2 border">Country</th>
          <th class="p-2 border">Social Media</th>
          <th class="p-2 border">Tour Package</th>
          <th class="p-2 border">Check In</th>
          <th class="p-2 border">Check Out</th>
          <th class="p-2 border">Hotel</th>
          <th class="p-2 border">Notes</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, i) in filteredStaff" :key="item.id">
          <td class="p-2 border">{{ i + 1 }}</td>
          <td class="p-2 border">{{ item.date }}</td>
          <td class="p-2 border">{{ item.name }}</td>
          <td class="p-2 border">{{ item.phone }}</td>
          <td class="p-2 border">{{ item.pic }}</td>
          <td class="p-2 border">{{ item.progress }}</td>
          <td class="p-2 border">{{ item.segmen }}</td>
          <td class="p-2 border">{{ item.via }}</td>
          <td class="p-2 border">{{ item.country }}</td>
          <td class="p-2 border">{{ item.social_media_id }}</td>
          <td class="p-2 border">{{ item.tour_packages }}</td>
          <td class="p-2 border">{{ item.check_in }}</td>
          <td class="p-2 border">{{ item.check_out }}</td>
          <td class="p-2 border">{{ item.hotel }}</td>
          <td class="p-2 border">{{ item.notes }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
