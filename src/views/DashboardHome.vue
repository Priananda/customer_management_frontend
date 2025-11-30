<script setup>
import {
  Search,
  Calendar,
  Filter,
  RotateCcw,
  ChevronDown,
  Users,
  Loader,
  CheckCircle2,
  XCircle,
  Download,
} from "lucide-vue-next";
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import api from "../api/api";
import { useAuthStore } from "../stores/auth";

// Ambil auth store
const authStore = useAuthStore();

// Set token axios dari Pinia
if (authStore.accessToken) {
  api.defaults.headers.common[
    "Authorization"
  ] = `Bearer ${authStore.accessToken}`;
}

// Ambil role dari store
const role = authStore.role;

// State
const searchKeyword = ref("");
const filterDate = ref("");
const filterProgress = ref("all");
const selectedSegmen = ref("all");
const newCustomers = ref([]);
const showProgressDropdown = ref(false);
const showSegmenDropdown = ref(false);

// Summary State
const summary = ref({
  total: 0,
  onProgress: 0,
  deal: 0,
  canceled: 0,
  todayCount: 0,
});

// Fetch Customers
const getNewCustomers = async () => {
  try {
    const res = await api.get("/new-customer");
    newCustomers.value = res.data.data.map((c) => ({
      id: c.id,
      date: c.date ?? "",
      phone: c.phone ?? "",
      name: c.name ?? "",
      progress: c.progress ?? "",
      pic: c.pic ?? "",
      segmen: c.segmen ?? "",
      via: c.via ?? "",
      country: c.country ?? "",
      social_media_id: c.social_media_id ?? "",
      tour_packages: c.tour_packages ?? "",
      check_in: c.check_in ?? "",
      check_out: c.check_out ?? "",
      hotel: c.hotel ?? "",
      notes: c.notes ?? "",
    }));
  } catch (err) {
    console.error("Error fetching customers:", err);
  }
};

// Fetch Summary
const getSummary = async () => {
  try {
    const res = await api.get("/new-customer/summary");
    summary.value = res.data.data;
  } catch (err) {
    console.error("Error fetching summary:", err);
  }
};

// Download CSV Today
const downloadCsv = () => {
  window.open(`${api.defaults.baseURL}/new-customer/export-csv`, "_blank");
};

// On Mounted
onMounted(() => {
  if (["admin", "super_admin", "pic", "staff"].includes(role)) {
    getNewCustomers();
    getSummary();
  }
  document.addEventListener("click", handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
});

// Search & Filter
const filteredCustomers = computed(() => {
  return newCustomers.value.filter((c) => {
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
      filterProgress.value !== "all"
        ? c.progress === filterProgress.value
        : true;
    const matchesSegmen =
      selectedSegmen.value !== "all"
        ? c.segmen.toLowerCase() === selectedSegmen.value.toLowerCase()
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
  return [...seg];
});

// Reset Filters
const resetFilters = () => {
  searchKeyword.value = "";
  filterDate.value = "";
  filterProgress.value = "all";
  selectedSegmen.value = "all";
};

// Current Date
const currentDate = computed(() => {
  const today = new Date();
  return today.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
});

// Badge class
const progressClass = (progress) => {
  const p = (progress || "").toLowerCase();
  if (p === "deal")
    return "bg-green-100 text-green-800 border border-green-200";
  if (p === "on progress")
    return "bg-blue-100 text-blue-800 border border-blue-200";
  if (p === "canceled") return "bg-red-100 text-red-800 border border-red-200";
  return "bg-slate-100 text-slate-700 border border-slate-200";
};

// Dropdown click outside
function handleClickOutside(e) {
  const progress = document.getElementById("progress-dropdown");
  const segmen = document.getElementById("segmen-dropdown");

  if (progress && !progress.contains(e.target))
    showProgressDropdown.value = false;
  if (segmen && !segmen.contains(e.target)) showSegmenDropdown.value = false;
}

// Close all dropdowns on input focus
function closeAllDropdowns() {
  showProgressDropdown.value = false;
  showSegmenDropdown.value = false;
}
</script>

<template>
  <div class="p-4 max-w-6xl mx-auto">
    <!-- TITLE -->
    <h2
      class="text-2xl font-bold mb-2 text-slate-800 tracking-tight flex items-center gap-2"
    >
      Dashboard
    </h2>
    <p class="text-md mb-6 text-slate-600">
      See all deal, new customer, new chat, and summary report
    </p>

    <!-- DATE SECTION -->
    <div class="mb-6">
      <p class="text-xl font-semibold mb-1 text-slate-800">{{ currentDate }}</p>
      <p class="text-md text-slate-600">Daily performance overview</p>
    </div>

    <!-- SUMMARY CARDS -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      <!-- Total Customers -->
      <div
        class="bg-white text-slate-700 p-5 rounded-xl shadow-md border border-slate-300 flex flex-col items-center gap-1"
      >
        <Users class="w-6 h-6 text-blue-800 mb-1" />
        <p class="font-medium text-md">Total</p>
        <h3 class="text-xl font-bold text-slate-900">{{ summary.total }}</h3>
        <p class="text-sm text-slate-500">New Customer</p>
      </div>

      <!-- On Progress -->
      <div
        class="bg-white text-slate-700 p-5 rounded-xl shadow-md border border-slate-300 flex flex-col items-center gap-1"
      >
        <Loader class="w-6 h-6 text-yellow-600 mb-1" />
        <p class="font-medium text-md">On Progress</p>
        <h3 class="text-xl font-bold text-slate-900">
          {{ summary.onProgress }}
        </h3>
        <p class="text-sm text-slate-500">Currently handled</p>
      </div>

      <!-- Deal -->
      <div
        class="bg-white text-slate-700 p-5 rounded-xl shadow-md border border-slate-300 flex flex-col items-center gap-1"
      >
        <CheckCircle2 class="w-6 h-6 text-green-600 mb-1" />
        <p class="font-medium text-md">Deal</p>
        <h3 class="text-xl font-bold text-slate-900">{{ summary.deal }}</h3>
        <p class="text-sm text-slate-500">Closed successfully</p>
      </div>

      <!-- Canceled -->
      <div
        class="bg-white text-slate-700 p-5 rounded-xl shadow-md border border-slate-300 flex flex-col items-center gap-1"
      >
        <XCircle class="w-6 h-6 text-red-600 mb-1" />
        <p class="font-medium text-md">Canceled</p>
        <h3 class="text-xl font-bold text-slate-900">
          {{ summary.canceled }}
        </h3>
        <p class="text-sm text-slate-500">Canceled orders</p>
      </div>

      <!-- Download Today Report -->
      <div
        class="bg-white text-slate-700 p-5 rounded-xl shadow-md border border-slate-300 flex flex-col items-center justify-center gap-2"
      >
        <Download class="w-6 h-6 text-blue-800" />
        <p class="font-medium text-sm sm:text-base">Today's Report</p>
        <button
          class="underline text-blue-600 hover:text-blue-800 text-sm sm:text-base"
          @click="downloadCsv"
        >
          Download CSV
        </button>
      </div>
    </div>

    <!-- FILTERS MODERN -->
    <div
      class="text-[15px] mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 bg-white p-4 rounded-xl shadow border border-slate-200"
    >
      <!-- Search -->
      <div class="relative">
        <Search class="w-4 h-4 text-slate-500 absolute left-3 top-3" />
        <input
          v-model="searchKeyword"
          @focus="closeAllDropdowns()"
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
          @focus="closeAllDropdowns()"
          type="date"
          class="w-full border border-slate-300 rounded-lg pl-10 pr-3 py-2 focus:outline-none"
        />
      </div>

      <!-- Progress -->
      <div class="relative" id="progress-dropdown">
        <button
          @click.stop="
            closeAllDropdowns();
            showProgressDropdown = !showProgressDropdown;
          "
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
            class="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden"
          >
            <div
              class="px-3 py-2 hover:bg-blue-50 cursor-pointer"
              @click="
                filterProgress = 'all';
                showProgressDropdown = false;
              "
            >
              All Progress
            </div>
            <div
              class="px-3 py-2 hover:bg-blue-50 cursor-pointer"
              @click="
                filterProgress = 'on progress';
                showProgressDropdown = false;
              "
            >
              On Progress
            </div>
            <div
              class="px-3 py-2 hover:bg-blue-50 cursor-pointer"
              @click="
                filterProgress = 'deal';
                showProgressDropdown = false;
              "
            >
              Deal
            </div>
            <div
              class="px-3 py-2 hover:bg-blue-50 cursor-pointer"
              @click="
                filterProgress = 'canceled';
                showProgressDropdown = false;
              "
            >
              Canceled
            </div>
          </div>
        </transition>
      </div>

      <!-- Segmen -->
      <div class="relative" id="segmen-dropdown">
        <button
          @click.stop="
            closeAllDropdowns();
            showSegmenDropdown = !showSegmenDropdown;
          "
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
            class="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden"
          >
            <div
              class="px-3 py-2 hover:bg-blue-50 cursor-pointer"
              @click="
                selectedSegmen = 'all';
                showSegmenDropdown = false;
              "
            >
              All Segmen
            </div>

            <div
              v-for="segment in uniqueSegmens"
              :key="segment"
              class="px-3 py-2 hover:bg-blue-50 cursor-pointer capitalize"
              @click="
                selectedSegmen = segment;
                showSegmenDropdown = false;
              "
            >
              {{ segment }}
            </div>
          </div>
        </transition>
      </div>

      <!-- Reset -->
      <button
        @click="resetFilters"
        class="flex items-center justify-center gap-2 bg-blue-900 hover:bg-blue-800 text-white font-semibold py-2 px-4 rounded-lg shadow"
      >
        <RotateCcw class="w-4 h-4" />
        Reset
      </button>
    </div>

    <!-- TABLE -->
    <div class="overflow-x-auto rounded-lg shadow-sm hidden-scroll">
      <table
        class="min-w-full bg-white border border-slate-200 rounded-lg text-sm table-fixed"
      >
        <thead class="bg-blue-900 text-white">
          <tr>
            <th class="px-4 py-3 text-left w-[10%]">Date</th>
            <th class="px-4 py-3 text-left w-[12%]">Phone</th>
            <th class="px-4 py-3 text-left w-[14%]">Name</th>
            <th class="px-4 py-3 text-left w-[10%]">Progress</th>
            <th class="px-4 py-3 text-left w-[10%]">PIC</th>
            <th class="px-4 py-3 text-left w-[8%]">Segmen</th>
            <th class="px-4 py-3 text-left w-[6%]">Via</th>
            <th class="px-4 py-3 text-left w-[8%]">Country</th>
            <th class="px-4 py-3 text-left w-[8%]">SM ID</th>
            <th class="px-4 py-3 text-left w-[12%]">Tour Packages</th>
            <th class="px-4 py-3 text-left w-[8%]">Check In</th>
            <th class="px-4 py-3 text-left w-[8%]">Check Out</th>
            <th class="px-4 py-3 text-left w-[8%]">Hotel</th>
            <th class="px-4 py-3 text-left w-[12%]">Notes</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="c in filteredCustomers"
            :key="c.id"
            class="border-b border-slate-200 hover:bg-blue-50 transition-colors"
          >
            <!-- gunakan align-middle supaya semua cell rata vertikal -->
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
                  progressClass(c.progress),
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
              {{ c.social_media_id }}
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
            <td class="px-4 py-3 align-middle text-left">{{ c.notes }}</td>
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
  transform: translateY(-4px);
}
</style>
