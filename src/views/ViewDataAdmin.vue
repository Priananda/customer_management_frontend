<script setup>
import { ref, onMounted, computed, onBeforeUnmount, watch } from "vue";
import {
  Search,
  Calendar,
  Filter,
  ChevronDown,
  RotateCcw,
} from "lucide-vue-next";
import TablePagination from "../components/TablePagination.vue";
import api from "../api/api";

// Data
const newCustomers = ref([]);
const loading = ref(true);

// Filters & Search
const searchKeyword = ref("");
const filterDate = ref("");
const filterProgress = ref("all");
const selectedSegmen = ref("all");

// Dropdown visibility
const showProgressDropdown = ref(false);
const showSegmenDropdown = ref(false);

// Pagination
const currentPage = ref(1);
const pageSize = ref(10);
const totalItems = ref(0);

const paginatedDataCustomers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  totalItems.value = filteredCustomers.value.length;
  return filteredCustomers.value.slice(start, end);
});
watch([searchKeyword, filterDate, filterProgress, selectedSegmen], () => {
  currentPage.value = 1;
});

// Load data
onMounted(async () => {
  try {
    const res = await api.get("/new-customer");
    newCustomers.value = res.data.data;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
});

// Filtered data
const filteredCustomers = computed(() => {
  return newCustomers.value.filter((c) => {
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
  newCustomers.value.forEach((c) => {
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

    "Handler",
    "Link Drive",
    "Total Pax",
    "Activity",
    "Payment Status",

    "Notes",
  ];
  const rows = filteredCustomers.value.map((c) => [
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

    c.deal?.handler ?? "",
    c.deal?.link_drive ?? "",
    c.deal?.total_pax ?? "",
    c.deal?.activity ?? "",
    c.deal?.payment_status ?? "",

    c.notes,
  ]);
  const csvContent =
    "data:text/csv;charset=utf-8," +
    [headers, ...rows].map((e) => e.join(",")).join("\n");
  const link = document.createElement("a");
  link.href = encodeURI(csvContent);
  link.setAttribute("download", "view_data_admin.csv");
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

const progressColor = (progress) => {
  const p = (progress || "").toLowerCase();
  if (p === "deal")
    return "bg-green-100 text-green-800 border border-green-200";
  if (p === "on progress")
    return "bg-blue-100 text-blue-800 border border-blue-200";
  if (p === "canceled") return "bg-red-100 text-red-800 border border-red-200";
  return "bg-slate-100 text-slate-700 border border-slate-200";
};
</script>

<template>
  <div class="container p-4 max-w-sm md:max-w-3xl lg:max-w-6xl mx-auto">
    <h2
      class="text-xl font-bold mb-2 text-slate-800 tracking-tight flex items-center gap-2"
    >
      Data Admin
    </h2>
    <p class="text-md mb-6 text-slate-600">Manage new customers efficiently.</p>

    <!-- Filter -->
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
            class="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg overflow-y-auto hidden-scroll max-h-[200px]"
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

    <!-- Table -->
    <div class="overflow-x-auto rounded-lg shadow-sm hidden-scroll">
      <table
        class="min-w-full bg-white border border-slate-200 rounded-lg text-sm table-fixed"
      >
        <thead class="bg-blue-900 text-white">
          <tr>
            <th class="px-4 py-3 text-left">No</th>
            <th class="px-4 py-3 text-left w-[10%]">Date</th>
            <th class="px-4 py-3 text-left w-[12%]">Phone</th>
            <th class="px-4 py-3 text-left w-[14%]">Customer Name</th>
            <th class="px-4 py-3 text-left w-[10%]">Progress</th>
            <th class="px-4 py-3 text-left w-[10%]">PIC</th>
            <th class="px-4 py-3 text-left w-[8%]">Segmen</th>
            <th class="px-4 py-3 text-left w-[6%]">Via</th>
            <th class="px-4 py-3 text-left w-[8%]">Country</th>
            <th class="px-4 py-3 text-left w-[8%]">Social Media</th>
            <th class="px-4 py-3 text-left w-[12%]">Tour Packages</th>
            <th class="px-4 py-3 text-left w-[8%]">Check In</th>
            <th class="px-4 py-3 text-left w-[8%]">Check Out</th>
            <th class="px-4 py-3 text-left w-[8%]">Hotel</th>
            <th class="px-4 py-3 text-left w-[10%]">Handler</th>
            <th class="px-4 py-3 text-left w-[12%]">Link Drive</th>
            <th class="px-4 py-3 text-left w-[8%]">Total Pax</th>
            <th class="px-4 py-3 text-left w-[10%]">Activity</th>
            <th class="px-4 py-3 text-left w-[10%]">Payment Status</th>
            <th class="px-4 py-3 text-left w-[12%]">Notes</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="15" class="p-4">
              <div class="space-y-2">
                <div class="h-4 bg-gray-300 rounded w-3/4 animate-pulse"></div>
                <div class="h-4 bg-gray-300 rounded w-full animate-pulse"></div>
                <div class="h-4 bg-gray-300 rounded w-5/6 animate-pulse"></div>
              </div>
            </td>
          </tr>
          <tr v-else-if="!loading && filteredCustomers.length === 0">
            <td
              colspan="15"
              class="text-center p-4 text-gray-800 font-semibold"
            >
              Data tidak ditemukan
            </td>
          </tr>
          <tr
            v-for="(c, i) in paginatedDataCustomers"
            :key="c.id"
            class="border-b border-slate-200 hover:bg-blue-50"
          >
            <td class="px-4 py-2">{{ i + 1 }}</td>
            <td class="px-4 py-3 align-middle text-left whitespace-nowrap">
              {{ c.date }}
            </td>
            <td class="px-4 py-3 align-middle text-left whitespace-nowrap">
              {{ c.phone }}
            </td>
            <td class="px-4 py-3 align-middle text-left">{{ c.name }}</td>

            <td class="px-4 py-3 align-middle text-left">
              <span
                :class="[
                  'inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-semibold w-24',
                  progressColor(c.progress),
                ]"
              >
                {{ c.progress }}
              </span>
            </td>

            <td class="px-4 py-3 align-middle text-left whitespace-nowrap">
              {{ c.pic }}
            </td>
            <td class="px-4 py-3 align-middle text-left">{{ c.segmen }}</td>
            <td class="px-4 py-3 align-middle text-left whitespace-nowrap">
              {{ c.via }}
            </td>
            <td class="px-4 py-3 align-middle text-left whitespace-nowrap">
              {{ c.country }}
            </td>
            <td class="px-4 py-3 align-middle text-left whitespace-nowrap">
              <a
                :href="c.social_media_id"
                target="_blank"
                class="text-blue-600 underline hover:text-blue-800"
              >
                {{ c.social_media_id }}
              </a>
            </td>

            <td class="px-4 py-3 align-middle text-left">
              {{ c.tour_packages }}
            </td>
            <td class="px-4 py-3 align-middle text-left whitespace-nowrap">
              {{ c.check_in }}
            </td>
            <td class="px-4 py-3 align-middle text-left whitespace-nowrap">
              {{ c.check_out }}
            </td>
            <td class="px-4 py-3 align-middle text-left">{{ c.hotel }}</td>

            <td>{{ c.deal?.handler }}</td>
            <td>{{ c.deal?.link_drive }}</td>
            <td>{{ c.deal?.total_pax }}</td>
            <td>{{ c.deal?.activity }}</td>
            <td>{{ c.deal?.payment_status }}</td>

            <td class="px-4 py-3 align-middle text-left">{{ c.notes }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <!-- Pagination -->
    <TablePagination
      :current-page="currentPage"
      :total-items="totalItems"
      :page-size="pageSize"
      @update:page="(page) => (currentPage = page)"
    />
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
