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
  Clock,
  X,
} from "lucide-vue-next";
import TablePagination from "../components/TablePagination.vue";
import {
  ref,
  computed,
  onMounted,
  onBeforeUnmount,
  watch,
  nextTick,
} from "vue";
import api from "../api/api";
import { useAuthStore } from "../stores/auth";
import checklistIcon from "@/assets/images/checklist2.png";
import calendar from "@/assets/images/calendar.png";

const authStore = useAuthStore();

if (authStore.accessToken) {
  api.defaults.headers.common[
    "Authorization"
  ] = `Bearer ${authStore.accessToken}`;
}
const role = authStore.role;

const searchKeyword = ref("");
const filterDate = ref("");
const filterProgress = ref("all");
const selectedSegmen = ref("all");
const newCustomers = ref([]);
const showProgressDropdown = ref(false);
const showSegmenDropdown = ref(false);
const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);
const totalItems = ref(0);

const summary = ref({
  total: 0,
  onProgress: 0,
  deal: 0,
  canceled: 0,
  postpone: 0,
  todayCount: 0,
});

const getNewCustomers = async () => {
  loading.value = true;
  try {
    const res = await api.get("/new-customer");
    newCustomers.value = res.data.data;
  } catch (err) {
  } finally {
    loading.value = false;
  }
};

const getSummary = async () => {
  try {
    const res = await api.get("/new-customer/summary");
    summary.value = res.data.data;
  } catch (err) {}
};

const month = ref("");
const year = ref("");
const filterMonth = ref("");
const isFiltering = ref(false);
const safe = (v) => (v ?? "").toString().toLowerCase();
const filteredCustomers = computed(() => {
  isFiltering.value = true;
  let result = newCustomers.value.filter((c) => {
    const keyword = safe(searchKeyword.value);
    const deal = c.latest_deal || {};
    const transport = deal.transports?.[0] || {};
    const identity = deal.customer_identity || {};

    const matchesKeyword =
      safe(c.date).includes(keyword) ||
      safe(c.email).includes(keyword) ||
      safe(c.phone).includes(keyword) ||
      safe(c.name).includes(keyword) ||
      safe(c.progress).includes(keyword) ||
      safe(c.pic).includes(keyword) ||
      safe(c.segmen).includes(keyword) ||
      safe(c.via).includes(keyword) ||
      safe(c.country).includes(keyword) ||
      safe(c.social_media_id).includes(keyword) ||
      safe(c.tour_packages).includes(keyword) ||
      safe(c.check_in).includes(keyword) ||
      safe(c.check_out).includes(keyword) ||
      safe(c.hotel).includes(keyword) ||
      safe(c.notes).includes(keyword) ||
      safe(deal.handler).includes(keyword) ||
      safe(deal.link_drive).includes(keyword) ||
      safe(deal.total_pax).includes(keyword) ||
      safe(deal.activity).includes(keyword) ||
      safe(deal.note_resto).includes(keyword) ||
      safe(deal.note_hotel).includes(keyword) ||
      safe(deal.payment_status).includes(keyword) ||
      safe(transport.guide).includes(keyword) ||
      safe(transport.hp_guide).includes(keyword) ||
      safe(transport.driver).includes(keyword) ||
      safe(transport.hp_driver).includes(keyword) ||
      safe(transport.note_operation).includes(keyword) ||
      safe(transport.report).includes(keyword) ||
      safe(identity.id_customer).includes(keyword) ||
      safe(identity.tanggal_lahir).includes(keyword);

    const matchesDate = filterDate.value
      ? (() => {
          const filter = filterDate.value;

          const checkIn = onlyDate(c.check_in);
          const checkOut = onlyDate(c.check_out);

          if (checkIn && checkOut) {
            return filter >= checkIn && filter <= checkOut;
          }
          return [onlyDate(c.date), onlyDate(identity.tanggal_lahir)].includes(
            filter
          );
        })()
      : true;

    const matchesMonth = filterMonth.value
      ? (() => {
          const filter = filterMonth.value;

          const checkInMonth = getMonth(c.check_in);
          const checkOutMonth = getMonth(c.check_out);

          if (checkInMonth && checkOutMonth) {
            return filter >= checkInMonth && filter <= checkOutMonth;
          }

          return [getMonth(c.date), getMonth(identity.tanggal_lahir)].includes(
            filter
          );
        })()
      : true;

    const matchesProgress =
      filterProgress.value !== "all"
        ? c.progress === filterProgress.value
        : true;

    const matchesSegmen =
      selectedSegmen.value !== "all"
        ? safe(c.segmen) === safe(selectedSegmen.value)
        : true;

    return (
      matchesKeyword &&
      matchesDate &&
      matchesMonth &&
      matchesProgress &&
      matchesSegmen
    );
  });

  nextTick(() => {
    setTimeout(() => {
      isFiltering.value = false;
    }, 700);
  });

  return result;
});

const onlyDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
};

const getMonth = (date) => {
  if (!date) return null;
  return date.slice(0, 7);
};

const paginatedDataCustomers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  totalItems.value = filteredCustomers.value.length;
  return filteredCustomers.value.slice(start, end);
});

const totalPages = computed(() =>
  Math.max(Math.ceil(filteredCustomers.value.length / pageSize.value), 1)
);

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
}
function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
}

watch(
  [
    searchKeyword,
    filterDate,
    filterMonth,
    month,
    year,
    filterProgress,
    selectedSegmen,
  ],
  () => {
    currentPage.value = 1;
  }
);

const uniqueSegmens = computed(() => {
  const seg = new Set();
  newCustomers.value.forEach((c) => {
    if (c.segmen) seg.add(c.segmen);
  });
  return [...seg];
});

const isRotating = ref(false);
const resetFilters = () => {
  isRotating.value = true;
  searchKeyword.value = "";
  filterDate.value = "";
  filterMonth.value = "";
  month.value = "";
  year.value = "";
  filterProgress.value = "all";
  selectedSegmen.value = "all";
  setTimeout(() => {
    isRotating.value = false;
  }, 600);
};

function handleClickOutside(e) {
  const progress = document.getElementById("progress-dropdown");
  const segmen = document.getElementById("segmen-dropdown");

  if (progress && !progress.contains(e.target))
    showProgressDropdown.value = false;
  if (segmen && !segmen.contains(e.target)) showSegmenDropdown.value = false;
}

function closeAllDropdowns() {
  showProgressDropdown.value = false;
  showSegmenDropdown.value = false;
}

const progressColor = (progress) => {
  const p = (progress || "").toLowerCase();
  if (p === "deal")
    return "bg-green-100 text-green-800 border border-green-200";
  if (p === "on progress")
    return "bg-blue-100 text-blue-800 border border-blue-200";
  if (p === "postpone")
    return "bg-yellow-100 text-yellow-800 border border-yellow-200";
  if (p === "canceled") return "bg-red-100 text-red-800 border border-red-200";
  return "bg-slate-100 text-slate-700 border border-slate-200";
};

const currentDate = computed(() => {
  const today = new Date();
  return today.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
});

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

const isBouncing = ref(false);
const downloadTodayPdf = async () => {
  try {
    const res = await api.get("/new-customer/report/today", {
      responseType: "blob",
    });

    const blob = new Blob([res.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `today-report-${new Date().toISOString().slice(0, 10)}.pdf`;
    link.click();

    window.URL.revokeObjectURL(url);
  } catch (err) {}
};

const handleDownloadClick = async () => {
  isBouncing.value = true;

  setTimeout(() => {
    isBouncing.value = false;
  }, 600);

  await downloadTodayPdf();
};

const socialMediaUrl = (username) => {
  if (!username) return "#";
  const clean = username.replace("@", "").trim();
  return `https://www.instagram.com/${clean}`;
};

const showHotelModal = ref(false);
const selectedHotels = ref([]);

const parseHotels = (hotelString) => {
  if (!hotelString) return [];

  return hotelString
    .split(/,|\|/)
    .map((h) => h.trim())
    .filter(Boolean);
};
const openHotelModal = (hotelString) => {
  selectedHotels.value = parseHotels(hotelString);
  showHotelModal.value = true;
};
const closeHotelModal = () => {
  showHotelModal.value = false;
  selectedHotels.value = [];
};

const tableSection = ref(null);
const filterBySummary = async (status) => {
  filterProgress.value = status;
  currentPage.value = 1;
  await nextTick();

  tableSection.value?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
};

const showMonthModal = ref(false);
const showYearModal = ref(false);
const months = [
  { value: "01", label: "Januari" },
  { value: "02", label: "Februari" },
  { value: "03", label: "Maret" },
  { value: "04", label: "April" },
  { value: "05", label: "Mei" },
  { value: "06", label: "Juni" },
  { value: "07", label: "Juli" },
  { value: "08", label: "Agustus" },
  { value: "09", label: "September" },
  { value: "10", label: "Oktober" },
  { value: "11", label: "November" },
  { value: "12", label: "Desember" },
];
const years = Array.from({ length: 10 }, (_, i) => 2025 + i);
function selectMonth(m) {
  month.value = m;
  showMonthModal.value = false;
}
function selectYear(y) {
  year.value = y;
  showYearModal.value = false;
}
watch([month, year], ([m, y]) => {
  if (m?.value && y) {
    filterMonth.value = `${y}-${m.value}`;
  } else {
    filterMonth.value = "";
  }
});

const tableWrapper = ref(null);
const isDragging = ref(false);
const startX = ref(0);
const scrollLeft = ref(0);
const startDrag = (e) => {
  isDragging.value = true;
  tableWrapper.value.classList.add("cursor-grabbing");

  startX.value = e.pageX - tableWrapper.value.offsetLeft;
  scrollLeft.value = tableWrapper.value.scrollLeft;
};
const stopDrag = () => {
  isDragging.value = false;
  tableWrapper.value.classList.remove("cursor-grabbing");
};
const onDrag = (e) => {
  if (!isDragging.value) return;

  e.preventDefault();

  const x = e.pageX - tableWrapper.value.offsetLeft;
  const walk = (x - startX.value) * 1.5;
  tableWrapper.value.scrollLeft = scrollLeft.value - walk;
};
</script>

<template>
  <div class="container p-4 max-w-sm md:max-w-3xl lg:max-w-6xl mx-auto">
    <div class="-mt-5 flex items-center gap-4 mb-8">
      <img
        :src="checklistIcon"
        alt="Overview illustration"
        class="w-28 h-28 object-contain"
      />

      <div>
        <h2 class="text-2xl font-bold text-black tracking-tight">Overview</h2>
        <p class="text-md text-slate-600">
          See all deal, new customer, new chat, and summary report
        </p>
      </div>
    </div>

    <div class="-mt-5 flex items-center gap-3 mb-6">
      <img
        :src="calendar"
        alt="Calendar"
        class="w-20 h-20 object-contain shrink-0"
      />
      <div>
        <p class="text-xl font-semibold text-black">
          {{ currentDate }}
        </p>
        <p class="text-md text-slate-600">Daily performance overview</p>
      </div>
    </div>

    <!-- Summary -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      <!-- Total Customers -->
      <div
        class="bg-linear-to-br from-indigo-700 to-blue-700 text-white p-5 rounded-2xl shadow-lg flex flex-col items-center gap-2"
      >
        <Users class="w-6 h-6 text-white mb-1" />
        <p class="font-medium text-md">Total</p>
        <h3 class="text-2xl font-bold">{{ summary.total }}</h3>
        <p class="text-sm">New Customer</p>
      </div>

      <!-- On Progress -->
      <div
        @click="filterBySummary('on progress')"
        class="bg-linear-to-br from-indigo-500/90 to-blue-500/90 text-white p-5 rounded-2xl shadow-lg flex flex-col items-center gap-2 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 cursor-pointer"
      >
        <Loader class="w-6 h-6 text-white mb-1 e" />
        <p class="font-medium text-md">On Progress</p>
        <h3 class="text-2xl font-bold">{{ summary.onProgress }}</h3>
        <p class="text-sm">Currently handled</p>
      </div>

      <!-- Deal -->
      <RouterLink
        to="/dashboard/deal-customer"
        class="bg-linear-to-br from-green-500/90 to-green-600/90 text-white p-5 rounded-2xl shadow-lg flex flex-col items-center gap-2 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 cursor-pointer"
      >
        <CheckCircle2 class="w-6 h-6 text-white mb-1" />
        <p class="font-medium text-md">Deal</p>
        <h3 class="text-2xl font-bold">{{ summary.deal }}</h3>
        <p class="text-sm">Closed successfully</p>
      </RouterLink>

      <!-- PostPone -->
      <div
        @click="filterBySummary('postpone')"
        class="bg-linear-to-br from-yellow-400/90 to-amber-500/90 text-white p-5 rounded-2xl shadow-lg flex flex-col items-center gap-2 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 cursor-pointer"
      >
        <Clock class="w-6 h-6 text-white mb-1" />
        <p class="font-medium text-md">PostPone</p>
        <h3 class="text-2xl font-bold">{{ summary.postpone }}</h3>
        <p class="text-sm">Postponed by customer</p>
      </div>

      <!-- Canceled -->
      <div
        @click="filterBySummary('canceled')"
        class="bg-linear-to-br from-red-500/90 to-red-600/90 text-white p-5 rounded-2xl shadow-lg flex flex-col items-center gap-2 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 cursor-pointer"
      >
        <XCircle class="w-6 h-6 text-white mb-1" />
        <p class="font-medium text-md">Canceled</p>
        <h3 class="text-2xl font-bold">{{ summary.canceled }}</h3>
        <p class="text-sm">Canceled orders</p>
      </div>

      <!-- Download -->
      <div
        class="bg-white text-slate-700 p-5 rounded-2xl shadow-lg flex flex-col items-center justify-center gap-3 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 cursor-pointer"
      >
        <Download
          class="w-6 h-6 text-blue-700 transition-transform"
          :class="{ 'jump-animation': isBouncing }"
        />
        <p class="font-medium text-sm sm:text-base">Today's Report</p>
        <button
          class="bg-linear-to-br from-indigo-700 to-blue-700 text-white font-normal text-md px-4 py-2 rounded-lg shadow hover:from-indigo-600 hover:to-blue-600 transition"
          @click="handleDownloadClick"
        >
          Download PDF
        </button>
      </div>
    </div>

    <!-- Filter -->
    <div
      class="text-[15px] mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 bg-white p-4 rounded-xl border border-slate-200"
    >
      <!-- Search -->
      <div class="relative">
        <Search class="w-4 h-4 text-slate-500 absolute left-3 top-3" />
        <input
          v-model="searchKeyword"
          @focus="closeAllDropdowns()"
          type="text"
          placeholder="Search..."
          class="w-full hover:shadow-md transition border border-slate-300 rounded-lg pl-10 pr-3 py-2 focus:outline-none"
        />
      </div>

      <!-- Date -->
      <div class="relative">
        <Calendar class="w-4 h-4 text-slate-500 absolute left-3 top-3" />

        <input
          v-model="filterDate"
          @focus="closeAllDropdowns()"
          type="date"
          class="w-full hover:shadow-md transition border border-slate-300 rounded-lg pl-10 pr-3 py-2 focus:outline-none"
        />
      </div>

      <div class="grid grid-cols-5 gap-3">
        <button
          @click="showMonthModal = true"
          class="relative col-span-3 w-full border border-slate-300 rounded-lg pl-10 pr-4 py-2 text-left hover:shadow-sm transition focus:outline-none overflow-hidden"
          :class="month ? 'text-slate-900' : 'text-slate-700'"
        >
          <Calendar
            class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"
          />
          <span class="whitespace-nowrap truncate">
            {{ month?.label || "Bulan" }}
          </span>
        </button>

        <button
          @click="showYearModal = true"
          class="relative col-span-2 w-full border border-slate-300 rounded-lg pl-10 pr-4 py-2 text-left hover:shadow-sm transition focus:outline-none overflow-hidden"
          :class="year ? 'text-slate-900' : 'text-slate-700'"
        >
          <Calendar
            class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"
          />
          <span class="whitespace-nowrap truncate">
            {{ year || "Tahun" }}
          </span>
        </button>
      </div>

      <div
        v-if="showMonthModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
        @click.self="showMonthModal = false"
      >
        <div
          class="relative bg-white w-80 border border-slate-300 rounded-lg shadow-lg overflow-hidden"
        >
          <X
            class="absolute top-3 right-3 w-5 h-5 cursor-pointer text-slate-500 hover:text-slate-700"
            @click="showMonthModal = false"
          />

          <div class="px-4 py-3 border-b border-slate-200">
            <h3 class="font-semibold text-gray-800">Pilih Bulan</h3>
          </div>

          <div class="max-h-72 overflow-auto hidden-scroll">
            <div
              v-for="m in months"
              :key="m.value"
              @click="selectMonth(m)"
              class="px-4 py-2 cursor-pointer text-gray-800 hover:bg-slate-100 transition"
            >
              {{ m.label }}
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="showYearModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
        @click.self="showYearModal = false"
      >
        <div
          class="relative bg-white w-80 border border-slate-300 rounded-lg shadow-lg overflow-hidden"
        >
          <X
            class="absolute top-3 right-3 w-5 h-5 cursor-pointer text-slate-500 hover:text-slate-700"
            @click="showYearModal = false"
          />

          <div class="px-4 py-3 border-b border-slate-200">
            <h3 class="font-semibold text-gray-800">Pilih Tahun</h3>
          </div>

          <div class="max-h-72 overflow-auto hidden-scroll">
            <div
              v-for="y in years"
              :key="y"
              @click="selectYear(y)"
              class="px-4 py-2 cursor-pointer text-gray-800 hover:bg-slate-100 transition"
            >
              {{ y }}
            </div>
          </div>
        </div>
      </div>

      <!-- Progress -->
      <div class="relative" id="progress-dropdown">
        <button
          @click.stop="
            closeAllDropdowns();
            showProgressDropdown = !showProgressDropdown;
          "
          class="w-full hover:shadow-md transition border border-slate-300 rounded-lg px-3 py-2 flex items-center justify-between"
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
            class="absolute z-20 mt-1 min-w-full bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden"
          >
            <div
              class="px-3 py-2 cursor-pointer hover:bg-slate-50 flex justify-start"
              @click="
                filterProgress = 'all';
                showProgressDropdown = false;
              "
            >
              <span
                class="inline-flex w-[130px] justify-center px-2 py-1 text-xs rounded-full font-medium border bg-slate-100 text-slate-700 border-slate-200"
              >
                All Progress
              </span>
            </div>

            <div
              class="px-3 py-2 cursor-pointer hover:bg-slate-50 flex"
              @click="
                filterProgress = 'on progress';
                showProgressDropdown = false;
              "
            >
              <span
                class="inline-flex w-[130px] justify-center px-2 py-1 text-xs rounded-full font-medium border bg-blue-100 text-blue-800 border-blue-200"
              >
                On Progress
              </span>
            </div>

            <div
              class="px-3 py-2 cursor-pointer hover:bg-slate-50 flex"
              @click="
                filterProgress = 'deal';
                showProgressDropdown = false;
              "
            >
              <span
                class="inline-flex w-[130px] justify-center px-2 py-1 text-xs rounded-full font-medium border bg-green-100 text-green-800 border-green-200"
              >
                Deal
              </span>
            </div>

            <div
              class="px-3 py-2 cursor-pointer hover:bg-slate-50 flex"
              @click="
                filterProgress = 'postpone';
                showProgressDropdown = false;
              "
            >
              <span
                class="inline-flex w-[130px] justify-center px-2 py-1 text-xs rounded-full font-medium border bg-yellow-100 text-yellow-800 border-yellow-200"
              >
                Postpone
              </span>
            </div>

            <div
              class="px-3 py-2 cursor-pointer hover:bg-slate-50 flex"
              @click="
                filterProgress = 'canceled';
                showProgressDropdown = false;
              "
            >
              <span
                class="inline-flex w-[130px] justify-center px-2 py-1 text-xs rounded-full font-medium border bg-red-100 text-red-800 border-red-200"
              >
                Canceled
              </span>
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
          class="w-full border border-slate-300 hover:shadow-md transition rounded-lg px-3 py-2 flex items-center justify-between"
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
              class="px-3 py-2 hover:bg-blue-50"
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
              class="px-3 py-2 hover:bg-blue-50 capitalize"
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

      <button
        @click="resetFilters"
        class="cursor-pointer flex items-center justify-center gap-2 bg-linear-to-br from-indigo-700 to-blue-700 hover:from-indigo-600 hover:to-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow transition"
      >
        <RotateCcw
          class="w-4 h-4 transition-transform"
          :class="{ 'rotate-animation': isRotating }"
        />
        Reset
      </button>
    </div>

    <!-- Table -->
    <div
      ref="tableWrapper"
      class="overflow-x-auto rounded-lg border border-slate-200 hidden-scroll cursor-grab select-none"
      @mousedown="startDrag"
      @mouseup="stopDrag"
      @mouseleave="stopDrag"
      @mousemove="onDrag"
    >
      <table
        ref="tableSection"
        class="min-w-full bg-white rounded-lg text-sm table-fixed"
      >
        <thead class="bg-linear-to-br from-indigo-700 to-blue-700 text-white">
          <tr>
            <th class="px-4 py-3 text-left">No</th>
            <th
              class="px-4 py-3 text-left w-[10%] whitespace-nowrap overflow-hidden text-ellipsis"
            >
              Date
            </th>
            <th
              class="px-4 py-3 text-left w-[12%] whitespace-nowrap overflow-hidden text-ellipsis"
            >
              Phone
            </th>
            <th
              class="px-4 py-3 text-left w-[14%] whitespace-nowrap overflow-hidden text-ellipsis"
            >
              Email
            </th>
            <th
              class="px-4 py-3 text-left w-[14%] whitespace-nowrap overflow-hidden text-ellipsis"
            >
              Guest Name
            </th>
            <th
              class="px-4 py-3 text-left w-[8%] whitespace-nowrap overflow-hidden text-ellipsis"
            >
              Check In
            </th>
            <th
              class="px-4 py-3 text-left w-[8%] whitespace-nowrap overflow-hidden text-ellipsis"
            >
              Check Out
            </th>
            <th
              class="px-4 py-3 text-left w-[12%] whitespace-nowrap overflow-hidden text-ellipsis"
            >
              Tour Packages
            </th>
            <th
              class="px-4 py-3 text-left w-[8%] whitespace-nowrap overflow-hidden text-ellipsis"
            >
              Country
            </th>
            <th
              class="px-4 py-3 text-left w-[10%] whitespace-nowrap overflow-hidden text-ellipsis"
            >
              Progress
            </th>
            <th
              class="px-4 py-3 text-left w-[10%] whitespace-nowrap overflow-hidden text-ellipsis"
            >
              PIC
            </th>
            <th
              class="px-4 py-3 text-left w-[8%] whitespace-nowrap overflow-hidden text-ellipsis"
            >
              Segmen
            </th>
            <th
              class="px-4 py-3 text-left w-[6%] whitespace-nowrap overflow-hidden text-ellipsis"
            >
              Via
            </th>

            <th
              class="px-4 py-3 text-left w-[8%] whitespace-nowrap overflow-hidden text-ellipsis"
            >
              Social Media
            </th>

            <th
              class="px-4 py-3 text-left w-[8%] whitespace-nowrap overflow-hidden text-ellipsis"
            >
              Hotel
            </th>
            <th
              class="px-4 py-3 text-left w-[10%] whitespace-nowrap overflow-hidden text-ellipsis"
            >
              Handler
            </th>
            <!-- <th
              class="px-4 py-3 text-left w-[12%] whitespace-nowrap overflow-hidden text-ellipsis"
            >
              Link Drive
            </th> -->
            <th
              class="px-4 py-3 text-left w-[8%] whitespace-nowrap overflow-hidden text-ellipsis"
            >
              Total Pax
            </th>
            <th
              class="px-4 py-3 text-left w-[10%] whitespace-nowrap overflow-hidden text-ellipsis"
            >
              Activity
            </th>
            <th
              class="px-4 py-3 text-left w-[10%] whitespace-nowrap overflow-hidden text-ellipsis"
            >
              Note Resto
            </th>
            <th
              class="px-4 py-3 text-left w-[10%] whitespace-nowrap overflow-hidden text-ellipsis"
            >
              Note Hotel
            </th>
            <th
              class="px-4 py-3 text-left w-[10%] whitespace-nowrap overflow-hidden text-ellipsis"
            >
              Payment Status
            </th>
            <th
              class="px-4 py-3 text-left w-[12%] whitespace-nowrap overflow-hidden text-ellipsis"
            >
              Notes
            </th>

            <th
              class="px-4 py-3 text-left w-[12%] whitespace-nowrap overflow-hidden text-ellipsis"
            >
              Guide
            </th>
            <th
              class="px-4 py-3 text-left w-[12%] whitespace-nowrap overflow-hidden text-ellipsis"
            >
              Hp Guide
            </th>
            <th
              class="px-4 py-3 text-left w-[12%] whitespace-nowrap overflow-hidden text-ellipsis"
            >
              Driver
            </th>
            <th
              class="px-4 py-3 text-left w-[12%] whitespace-nowrap overflow-hidden text-ellipsis"
            >
              Hp Driver
            </th>
            <th
              class="px-4 py-3 text-left w-[12%] whitespace-nowrap overflow-hidden text-ellipsis"
            >
              Note Operation
            </th>
            <th
              class="px-4 py-3 text-left w-[12%] whitespace-nowrap overflow-hidden text-ellipsis"
            >
              Report
            </th>

            <th
              class="px-4 py-3 text-left w-[12%] whitespace-nowrap overflow-hidden text-ellipsis"
            >
              Passport/Ktp
            </th>
            <th
              class="px-4 py-3 text-left w-[12%] whitespace-nowrap overflow-hidden text-ellipsis"
            >
              Tanggal Lahir
            </th>
          </tr>
        </thead>

        <tbody>
          <tr v-if="loading || isFiltering">
            <td colspan="30" class="p-4 space-y-2">
              <div
                class="h-4 bg-gray-300 rounded-md w-full relative overflow-hidden shimmer"
              ></div>
              <div
                class="h-4 bg-gray-300 rounded-md w-5/6 relative overflow-hidden shimmer"
              ></div>
            </td>
          </tr>

          <tr
            v-else-if="
              !loading && !isFiltering && filteredCustomers.length === 0
            "
          >
            <td
              colspan="15"
              class="text-center p-4 text-gray-800 font-semibold"
            >
              Data not found
            </td>
          </tr>

          <tr
            v-if="!loading && !isFiltering"
            v-for="(c, i) in paginatedDataCustomers"
            :key="c.id"
            class="border-b border-slate-200 hover:bg-blue-50 transition-colors"
          >
            <!-- No -->
            <td class="px-4 py-2 whitespace-nowrap">
              {{ (currentPage - 1) * pageSize + i + 1 }}
            </td>

            <!-- Date -->
            <td class="px-4 py-3 whitespace-nowrap">{{ c.date ?? "-" }}</td>

            <!-- Phone -->
            <td class="px-4 py-3 whitespace-nowrap">{{ c.phone ?? "-" }}</td>

            <!-- Email -->
            <td class="px-4 py-3">{{ c.email ?? "-" }}</td>

            <!-- Guest Name -->
            <td class="px-4 py-3">{{ c.name ?? "-" }}</td>

            <!-- Check In -->
            <td class="px-4 py-3 whitespace-nowrap">{{ c.check_in ?? "-" }}</td>

            <!-- Check Out -->
            <td class="px-4 py-3 whitespace-nowrap">
              {{ c.check_out ?? "-" }}
            </td>

            <!-- Tour Packages -->
            <td class="px-4 py-3 whitespace-nowrap">
              {{ c.tour_packages ?? "-" }}
            </td>

            <!-- Country -->
            <td class="px-4 py-3 whitespace-nowrap">{{ c.country ?? "-" }}</td>

            <!-- Progress -->
            <td class="px-4 py-3 whitespace-nowrap">
              <span
                :class="[
                  'inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-semibold w-24',
                  progressColor(c.progress),
                ]"
              >
                {{ c.progress ?? "-" }}
              </span>
            </td>

            <!-- PIC -->
            <td class="px-4 py-3 whitespace-nowrap">
              {{ c.pic ?? "-" }}
            </td>

            <!-- Segmen -->
            <td class="px-4 py-3 whitespace-nowrap">{{ c.segmen ?? "-" }}</td>

            <!-- Via -->
            <td class="px-4 py-3 whitespace-nowrap">{{ c.via ?? "-" }}</td>

            <!-- Social Media -->
            <td class="px-4 py-3 whitespace-nowrap">
              <a
                v-if="c.social_media_id"
                :href="socialMediaUrl(c.social_media_id)"
                target="_blank"
                rel="noopener noreferrer"
                class="text-blue-600 underline"
              >
                {{ c.social_media_id ?? "-" }}
              </a>
              <span v-else>-</span>
            </td>

            <!-- Hotel -->
            <td class="px-4 py-3 whitespace-nowrap">
              <button
                v-if="c.hotel"
                @click="openHotelModal(c.hotel)"
                class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 hover:text-blue-800 transition"
              >
                View
              </button>

              <span v-else>-</span>
            </td>
            <!-- Hotel Modal -->
            <Transition
              enter-active-class="transition duration-200 ease-out"
              enter-from-class="opacity-0 scale-95"
              enter-to-class="opacity-100 scale-100"
              leave-active-class="transition duration-150 ease-in"
              leave-from-class="opacity-100 scale-100"
              leave-to-class="opacity-0 scale-95"
            >
              <div
                v-if="showHotelModal"
                class="px-2 fixed inset-0 z-50 flex items-center justify-center bg-black/10"
                @click.self="closeHotelModal"
              >
                <!-- Modal Card -->
                <div
                  class="bg-white w-full max-w-xl rounded-xl shadow-md overflow-hidden"
                >
                  <!-- Header -->
                  <div class="px-6 py-4 flex items-center justify-between">
                    <h3 class="text-md font-semibold text-black">
                      Hotel List
                      <span class="ml-2 text-sm text-gray-500">
                        ({{ selectedHotels.length }})
                      </span>
                    </h3>

                    <button
                      @click="closeHotelModal"
                      class="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-200 text-gray-700"
                    >
                      ✕
                    </button>
                  </div>

                  <!-- Content -->
                  <div class="p-6">
                    <div
                      v-if="selectedHotels.length"
                      class="flex flex-col gap-3 max-h-80 overflow-y-auto hide-scrollbar"
                    >
                      <div
                        v-for="(hotel, i) in selectedHotels"
                        :key="i"
                        class="rounded-lg border border-slate-200 px-4 py-3 bg-slate-50 hover:bg-white hover:shadow-sm transition"
                      >
                        <p
                          class="text-sm font-medium text-slate-800 leading-snug"
                        >
                          {{ hotel }}
                        </p>
                      </div>
                    </div>

                    <p v-else class="text-sm text-center text-slate-500 py-8">
                      No hotel data
                    </p>
                  </div>

                  <!-- Footer -->
                  <div class="px-6 py-4 flex justify-end">
                    <button
                      @click="closeHotelModal"
                      class="px-4 py-2 text-sm rounded-lg bg-slate-800 text-white hover:bg-slate-700"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </Transition>

            <!-- Handler -->
            <td class="px-4 py-3 whitespace-nowrap">
              {{ c.latest_deal?.handler ?? "-" }}
            </td>

            <!-- Link Drive -->
            <!-- <td class="px-4 py-3 whitespace-nowrap">
              <a
                v-if="c.latest_deal?.link_drive"
                :href="c.latest_deal.link_drive"
                target="_blank"
                class="text-blue-600 underline"
              >
                Drive
              </a>
              <span v-else>-</span>
            </td> -->

            <!-- Total Pax -->
            <td class="px-4 py-3 whitespace-nowrap">
              {{ c.latest_deal?.total_pax ?? "-" }}
            </td>

            <!-- Activity -->
            <td class="px-4 py-3 whitespace-nowrap">
              {{ c.latest_deal?.activity ?? "-" }}
            </td>

            <!-- Note Resto -->
            <td class="px-4 py-3 whitespace-nowrap">
              {{ c.latest_deal?.note_resto ?? "-" }}
            </td>

            <!-- Note Hotel -->
            <td class="px-4 py-3 whitespace-nowrap">
              {{ c.latest_deal?.note_hotel ?? "-" }}
            </td>

            <!-- Payment Status -->
            <td class="px-4 py-3 whitespace-nowrap">
              <span
                v-if="c.latest_deal?.payment_status"
                :class="[
                  'inline-flex items-center justify-center',
                  'w-20 px-2 py-1',
                  'rounded-full text-xs font-semibold text-center',
                  c.latest_deal.payment_status === 'paid'
                    ? 'bg-yellow-100 text-yellow-700 border border-yellow-200 '
                    : 'bg-green-100 text-green-700 border border-green-200',
                ]"
              >
                {{ c.latest_deal.payment_status ?? "-" }}
              </span>
              <span v-else>-</span>
            </td>

            <!-- Notes -->
            <td class="px-4 py-3 whitespace-nowrap">{{ c.notes ?? "-" }}</td>

            <!-- Guide -->
            <td class="px-4 py-3 whitespace-nowrap">
              {{ c.latest_deal?.transports?.[0]?.guide ?? "-" }}
            </td>

            <!-- Hp Guide -->
            <td class="px-4 py-3 whitespace-nowrap">
              {{ c.latest_deal?.transports?.[0]?.hp_guide ?? "-" }}
            </td>

            <!-- Driver -->
            <td class="px-4 py-3 whitespace-nowrap">
              {{ c.latest_deal?.transports?.[0]?.driver ?? "-" }}
            </td>

            <!-- Hp Driver -->
            <td class="px-4 py-3 whitespace-nowrap">
              {{ c.latest_deal?.transports?.[0]?.hp_driver ?? "-" }}
            </td>

            <!-- Note Operation -->
            <td class="px-4 py-3 whitespace-nowrap">
              {{ c.latest_deal?.transports?.[0]?.note_operation ?? "-" }}
            </td>

            <!-- Report -->
            <td class="px-4 py-3 whitespace-nowrap">
              {{ c.latest_deal?.transports?.[0]?.report ?? "-" }}
            </td>

            <!-- Passport / KTP -->
            <td class="px-4 py-3 whitespace-nowrap">
              {{ c.latest_deal?.customer_identity?.id_customer ?? "-" }}
            </td>

            <!-- Tanggal Lahir -->
            <td class="px-4 py-3 whitespace-nowrap">
              {{ c.latest_deal?.customer_identity?.tanggal_lahir ?? "-" }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <!-- Pagination -->
    <!-- <TablePagination
      :current-page="currentPage"
      :total-items="totalItemsFiltered"
      :page-size="pageSize"
      @update:page="(page) => (currentPage = page)"
    /> -->
    <div class="flex items-center justify-center mt-6 text-sm gap-3">
      <button
        class="px-3 py-1 rounded shadow bg-blue-800 text-white disabled:bg-blue-300"
        :disabled="currentPage <= 1"
        @click="prevPage"
      >
        Prev
      </button>
      <span class="text-gray-700"
        >Page {{ currentPage }} of {{ totalPages }}</span
      >
      <button
        class="px-3 py-1 rounded shadow bg-blue-800 text-white disabled:bg-blue-300"
        :disabled="currentPage >= totalPages"
        @click="nextPage"
      >
        Next
      </button>
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

.shimmer {
  position: relative;
  background-color: #e2e8f0;
}

.shimmer::after {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    #1d4fd86a 0%,
    rgba(156, 163, 175, 0.3) 50%,
    #1d4fd86a 0%
  );
  animation: shimmer 1.5s infinite;
}
@keyframes shimmer {
  0% {
    transform: translateX(0%);
  }
  100% {
    transform: translateX(100%);
  }
}

@keyframes animIconDowlaoad {
  0%,
  100% {
    transform: translateY(0);
  }
  25% {
    transform: translateY(-6px);
  }
  50% {
    transform: translateY(-12px);
  }
  75% {
    transform: translateY(-6px);
  }
}

.jump-animation {
  animation: animIconDowlaoad 0.6s ease-in-out;
}
.rotate-animation {
  animation: rotateClick 0.6s ease-in-out;
}

@keyframes rotateClick {
  0% {
    transform: rotate(0deg);
  }
  50% {
    transform: rotate(180deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
