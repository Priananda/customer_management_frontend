<script setup>
import { ref, onMounted, computed, onBeforeUnmount } from "vue";
import {
  Search,
  Calendar,
  Filter,
  ChevronDown,
  RotateCcw,
} from "lucide-vue-next";
import api from "../api/api";

// Data
const dataStaff = ref([]);
const loading = ref(true);

// Filters & Search
const searchKeyword = ref("");
const filterDate = ref("");
const filterProgress = ref("all");
const selectedSegmen = ref("all");

// Dropdown visibility
const showProgressDropdown = ref(false);
const showSegmenDropdown = ref(false);

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
    const keyword = (searchKeyword.value || "").toLowerCase();
    const matchesKeyword =
      (c.date || "").toLowerCase().includes(keyword) ||
      (c.phone || "").toLowerCase().includes(keyword) ||
      (c.name || "").toLowerCase().includes(keyword) ||
      (c.progress || "").toLowerCase().includes(keyword) ||
      (c.pic || "").toLowerCase().includes(keyword) ||
      (c.segmen || "").toLowerCase().includes(keyword) ||
      (c.via || "").toLowerCase().includes(keyword) ||
      (c.country || "").toLowerCase().includes(keyword) ||
      (c.social_media_id || "").toLowerCase().includes(keyword) ||
      (c.tour_packages || "").toLowerCase().includes(keyword) ||
      (c.check_in || "").toLowerCase().includes(keyword) ||
      (c.check_out || "").toLowerCase().includes(keyword) ||
      (c.hotel || "").toLowerCase().includes(keyword) ||
      (c.notes || "").toLowerCase().includes(keyword);

    const matchesDate = filterDate.value ? c.date === filterDate.value : true;
    const matchesProgress =
      filterProgress.value && filterProgress.value !== "all"
        ? (c.progress || "").toLowerCase() ===
          filterProgress.value.toLowerCase()
        : true;
    const matchesSegmen =
      selectedSegmen.value && selectedSegmen.value !== "all"
        ? (c.segmen || "").toLowerCase() === selectedSegmen.value.toLowerCase()
        : true;

    return matchesKeyword && matchesDate && matchesProgress && matchesSegmen;
  });
});

// Unique Segmen
const uniqueSegmens = computed(() => {
  const seg = new Set();
  dataStaff.value.forEach((c) => {
    if (c.segmen) seg.add(c.segmen);
  });
  return Array.from(seg);
});

// CSV download
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
  const link = document.createElement("a");
  link.href = encodeURI(csvContent);
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

// Dropdown handlers
function handleClickOutside(e) {
  const progress = document.getElementById("progress-dropdown");
  const segmen = document.getElementById("segmen-dropdown");
  if (progress && !progress.contains(e.target))
    showProgressDropdown.value = false;
  if (segmen && !segmen.contains(e.target)) showSegmenDropdown.value = false;
}
onMounted(() => document.addEventListener("click", handleClickOutside));
onBeforeUnmount(() =>
  document.removeEventListener("click", handleClickOutside)
);

const progressOptions = ["on progress", "deal", "canceled"];
function selectProgress(val) {
  filterProgress.value = val;
  showProgressDropdown.value = false;
}
function selectSegmen(val) {
  selectedSegmen.value = val;
  showSegmenDropdown.value = false;
}
</script>

<template>
  <div class="p-5 max-w-6xl mx-auto">
    <!-- TITLE -->
    <h2
      class="text-xl font-bold mb-2 text-slate-800 tracking-tight flex items-center gap-2"
    >
      Data Staff
    </h2>
    <p class="text-md mb-6 text-slate-600">Manage new customers efficiently.</p>

    <!-- FILTERS -->
    <div
      class="text-[15px] mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 bg-white p-4 rounded-xl shadow border border-slate-200"
    >
      <!-- Search -->
      <div class="relative">
        <Search class="w-4 h-4 text-slate-500 absolute left-3 top-3" />
        <input
          v-model="searchKeyword"
          type="text"
          placeholder="Search..."
          class="w-full border border-slate-300 rounded-lg pl-10 pr-3 py-2 focus:outline-none"
        />
      </div>

      <!-- Date -->
      <div class="relative">
        <Calendar class="w-4 h-4 text-slate-500 absolute left-3 top-3" />
        <input
          v-model="filterDate"
          type="date"
          class="w-full border border-slate-300 rounded-lg pl-10 pr-3 py-2 focus:outline-none"
        />
      </div>

      <!-- Progress Dropdown -->
      <div class="relative" id="progress-dropdown">
        <button
          @click.stop="showProgressDropdown = !showProgressDropdown"
          class="w-full border border-slate-300 rounded-lg px-3 py-2 flex items-center justify-between"
        >
          <div class="flex items-center gap-2">
            <Filter class="w-4 h-4 text-slate-500" />
            <span class="text-slate-700 capitalize">
              {{ filterProgress === "all" ? "All Progress" : filterProgress }}
            </span>
          </div>
          <ChevronDown class="w-4 h-4 text-slate-500" />
        </button>
        <transition name="dropdown">
          <div
            v-if="showProgressDropdown"
            class="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden"
          >
            <div
              class="px-3 py-2 hover:bg-blue-50 cursor-pointer"
              @click="selectProgress('all')"
            >
              All Progress
            </div>
            <div
              v-for="p in progressOptions"
              :key="p"
              class="px-3 py-2 hover:bg-blue-50 cursor-pointer capitalize"
              @click="selectProgress(p)"
            >
              {{ p }}
            </div>
          </div>
        </transition>
      </div>

      <!-- Segmen Dropdown -->
      <div class="relative" id="segmen-dropdown">
        <button
          @click.stop="showSegmenDropdown = !showSegmenDropdown"
          class="w-full border border-slate-300 rounded-lg px-3 py-2 flex items-center justify-between"
        >
          <div class="flex items-center gap-2">
            <Filter class="w-4 h-4 text-slate-500" />
            <span class="text-slate-700 capitalize">
              {{ selectedSegmen === "all" ? "All Segmen" : selectedSegmen }}
            </span>
          </div>
          <ChevronDown class="w-4 h-4 text-slate-500" />
        </button>
        <transition name="dropdown">
          <div
            v-if="showSegmenDropdown"
            class="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden"
          >
            <div
              class="px-3 py-2 hover:bg-blue-50 cursor-pointer"
              @click="selectSegmen('all')"
            >
              All Segmen
            </div>
            <div
              v-for="s in uniqueSegmens"
              :key="s"
              class="px-3 py-2 hover:bg-blue-50 cursor-pointer capitalize"
              @click="selectSegmen(s)"
            >
              {{ s }}
            </div>
          </div>
        </transition>
      </div>

      <div class="lg:col-span-5 flex gap-2 justify-end">
        <button
          @click="downloadCSV"
          class="bg-blue-900 hover:bg-blue-900 text-white font-medium py-2 px-4 rounded-lg"
        >
          Download CSV
        </button>
        <button
          @click="resetFilters"
          class="flex items-center justify-center gap-2 bg-blue-900 text-white font-semibold py-2 px-4 rounded-lg shadow"
        >
          <RotateCcw class="w-4 h-4" />
          Reset
        </button>
      </div>
    </div>

    <!-- TABLE -->
    <div class="overflow-x-auto rounded-lg shadow-sm hidden-scroll">
      <table
        class="min-w-full bg-white border border-slate-200 rounded-lg text-sm table-fixed"
      >
        <thead class="bg-blue-900 text-white">
          <tr>
            <th class="px-4 py-3 text-left">NO</th>
            <th class="px-4 py-3 text-left">Date</th>
            <th class="px-4 py-3 text-left">Name</th>
            <th class="px-4 py-3 text-left">Phone</th>
            <th class="px-4 py-3 text-left">PIC</th>
            <th class="px-4 py-3 text-left">Progress</th>
            <th class="px-4 py-3 text-left">Segmen</th>
            <th class="px-4 py-3 text-left">Via</th>
            <th class="px-4 py-3 text-left">Country</th>
            <th class="px-4 py-3 text-left">Social Media</th>
            <th class="px-4 py-3 text-left">Tour Package</th>
            <th class="px-4 py-3 text-left">Check In</th>
            <th class="px-4 py-3 text-left">Check Out</th>
            <th class="px-4 py-3 text-left">Hotel</th>
            <th class="px-4 py-3 text-left">Notes</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="15" class="text-center p-4">Loading...</td>
          </tr>
          <tr v-else-if="!loading && filteredStaff.length === 0">
            <td
              colspan="15"
              class="text-center p-4 text-gray-800 font-semibold"
            >
              Data tidak ditemukan
            </td>
          </tr>
          <tr
            v-for="(c, i) in filteredStaff"
            :key="c.id"
            class="border-b border-slate-200 hover:bg-blue-50"
          >
            <td class="px-4 py-2">{{ i + 1 }}</td>
            <td class="px-4 py-2">{{ c.date }}</td>
            <td class="px-4 py-2">{{ c.name }}</td>
            <td class="px-4 py-2">{{ c.phone }}</td>
            <td class="px-4 py-2">{{ c.pic }}</td>
            <td class="px-4 py-2">{{ c.progress }}</td>
            <td class="px-4 py-2">{{ c.segmen }}</td>
            <td class="px-4 py-2">{{ c.via }}</td>
            <td class="px-4 py-2">{{ c.country }}</td>
            <td class="px-4 py-2">{{ c.social_media_id }}</td>
            <td class="px-4 py-2">{{ c.tour_packages }}</td>
            <td class="px-4 py-2">{{ c.check_in }}</td>
            <td class="px-4 py-2">{{ c.check_out }}</td>
            <td class="px-4 py-2">{{ c.hotel }}</td>
            <td class="px-4 py-2">{{ c.notes }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.hidden-scroll {
  overflow: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.hidden-scroll::-webkit-scrollbar {
  display: none;
}
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.15s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
