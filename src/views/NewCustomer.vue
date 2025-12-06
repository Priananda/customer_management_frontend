<script setup>
import {
  Search,
  Calendar,
  Filter,
  ChevronDown,
  ChevronRight,
  Pencil,
  Trash2,
  RotateCcw,
} from "lucide-vue-next";
import ConfirmModal from "@/components/ConfirmModalDelete.vue";
import TablePagination from "../components/TablePagination.vue";
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import api from "../api/api";
import { useAuthStore } from "../stores/auth.js";

const authStore = useAuthStore();

// Set token di axios
if (authStore.accessToken) {
  api.defaults.headers.common[
    "Authorization"
  ] = `Bearer ${authStore.accessToken}`;
}

// permissions
const canEdit = ["admin", "staff", "super_admin", "pic"].includes(
  authStore.user?.role || ""
);

// State
const newCustomers = ref([]);
const summary = ref({
  total: 0,
  onProgress: 0,
  deal: 0,
  canceled: 0,
  todayCount: 0,
});

// filters
const searchKeyword = ref("");
const filterDate = ref("");
const filterProgress = ref("all");
const selectedSegmen = ref("all");

// Pagination
const currentPage = ref(1);
const pageSize = ref(10);
const totalItems = ref(0);

// modal & form
const loadingModal = ref(false);
const showModal = ref(false);
const editId = ref(null);
const form = ref({
  date: "",
  phone: "",
  name: "",
  progress: "",
  pic: "",
  segmen: "",
  via: "",
  country: "",
  social_media_id: "",
  tour_packages: "",
  check_in: "",
  check_out: "",
  hotel: [""], // ubah dari string ke array
  notes: "",
});

// dropdown state
const showProgressDropdown = ref(false);
const showModalProgressDropdown = ref(false);
const showSegmenDropdown = ref(false);

// loading tabel
const loading = ref(false);

// Modal delete
const showDeleteModal = ref(false);
const selectedId = ref(null);

const getNewCustomers = async () => {
  loading.value = true;
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
    newCustomers.value = [];
  } finally {
    loading.value = false;
  }
};

const getSummary = async () => {
  try {
    const res = await api.get("/new-customer/summary");
    summary.value = res.data.data;
  } catch (err) {
    console.error("Error fetching summary:", err);
  }
};

const submitForm = async () => {
  if (loadingModal.value) return;
  loadingModal.value = true;

  try {
    // Gabungkan hotel array menjadi string
    const payload = {
      ...form.value,
      hotel: form.value.hotel.join(", "),
    };

    if (editId.value) {
      await api.put(`/new-customer/${editId.value}`, payload);
    } else {
      await api.post("/new-customer", payload);
    }

    resetForm();
    await getNewCustomers();
    await getSummary();
    closeModal();
  } catch (err) {
    console.error("Error submitting form:", err);
  }
  loadingModal.value = false;
};

const confirmDelete = async () => {
  try {
    await api.delete(`/new-customer/${selectedId.value}`);
    await getNewCustomers();
    await getSummary();
  } catch (error) {
    console.error(error);
  } finally {
    showDeleteModal.value = false;
  }
};

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
      formatDate(c.check_in).includes(keyword) || // <-- pakai formatDate
      formatDate(c.check_out).includes(keyword) || // <-- pakai formatDate
      (c.hotel || "").toLowerCase().includes(keyword) ||
      (c.notes || "").toLowerCase().includes(keyword);

    const matchesDate = filterDate.value
      ? formatDate(c.date) === filterDate.value ||
        formatDate(c.check_in) === filterDate.value ||
        formatDate(c.check_out) === filterDate.value
      : true;

    const matchesProgress =
      filterProgress.value && filterProgress.value !== "all"
        ? c.progress === filterProgress.value
        : true;
    const matchesSegmen =
      selectedSegmen.value && selectedSegmen.value !== "all"
        ? (c.segmen || "").toLowerCase() === selectedSegmen.value.toLowerCase()
        : true;

    return matchesKeyword && matchesDate && matchesProgress && matchesSegmen;
  });
});

const formatDate = (date) => {
  if (!date) return "";
  if (typeof date === "string") return date; // asumsikan sudah "YYYY-MM-DD"
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const year = d.getFullYear();
  return `${year}-${month}-${day}`;
};

const uniqueSegmens = computed(() => {
  const seg = new Set();
  newCustomers.value.forEach((c) => {
    if (c.segmen) seg.add(c.segmen);
  });
  return Array.from(seg);
});

const progressColor = (progress) => {
  const p = (progress || "").toString().toLowerCase();
  if (p === "deal")
    return "bg-green-100 text-green-800 border border-green-200";
  if (p === "on progress")
    return "bg-blue-100 text-blue-800 border border-blue-200";
  if (p === "canceled") return "bg-red-100 text-red-800 border border-red-200";
  return "bg-slate-100 text-slate-700 border border-slate-200";
};

const openCreateModal = () => {
  resetForm();
  editId.value = null;

  form.value.pic = formatRole(authStore.user?.role);

  showModal.value = true;
};

const openEditModal = (customer) => {
  editId.value = customer.id;

  Object.keys(form.value).forEach((k) => {
    form.value[k] = customer[k] ?? "";
  });

  // Pastikan hotel selalu array
  form.value.hotel = customer.hotel
    ? customer.hotel.split(",").map((h) => h.trim())
    : [""];

  form.value.pic = formatRole(authStore.user?.role);

  showModal.value = true;
};

function formatRole(role) {
  if (!role) return "";
  return role
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const resetForm = () => {
  Object.keys(form.value).forEach((k) => {
    if (k === "hotel") {
      form.value[k] = [""];
    } else {
      form.value[k] = "";
    }
  });
  editId.value = null;
};

const closeModal = () => {
  showModal.value = false;
  resetForm();
};

function closeAllDropdowns() {
  showProgressDropdown.value = false;
  showSegmenDropdown.value = false;
}

function openOnlyProgress() {
  closeAllDropdowns();
  showProgressDropdown.value = !showProgressDropdown.value;
}

function openOnlySegmen() {
  closeAllDropdowns();
  showSegmenDropdown.value = !showSegmenDropdown.value;
}

function selectProgress(val) {
  filterProgress.value = val;
  showProgressDropdown.value = false;
}

function selectSegmen(val) {
  selectedSegmen.value = val;
  showSegmenDropdown.value = false;
}

function selectModalProgress(val) {
  form.value.progress = val;
  showModalProgressDropdown.value = false;
}

const downloadCSV = () => {
  const headers = [
    "Date",
    "Phone",
    "Customer Name",
    "Progress",
    "PIC",
    "Segmen",
    "Via",
    "Country",
    "Social Media",
    "Tour Packages",
    "Check In",
    "Check Out",
    "Hotel",
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
    c.notes,
  ]);

  const csvContent =
    "data:text/csv;charset=utf-8," +
    [headers, ...rows].map((e) => e.join(",")).join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "new_customers.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

function handleClickOutside(e) {
  const progress = document.getElementById("progress-dropdown");
  const segmen = document.getElementById("segmen-dropdown");

  if (progress && !progress.contains(e.target))
    showProgressDropdown.value = false;
  if (segmen && !segmen.contains(e.target)) showSegmenDropdown.value = false;
}

onMounted(() => {
  if (canEdit) {
    getNewCustomers();
    getSummary();
  }
  document.addEventListener("click", handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
});

const progressOptions = ["on progress", "deal", "canceled"];

// Reset all filter
function resetFilters() {
  searchKeyword.value = "";
  filterDate.value = "";
  filterProgress.value = "all";
  selectedSegmen.value = "all";
}

const paginatedDataCustomers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  totalItems.value = filteredCustomers.value.length;
  return filteredCustomers.value.slice(start, end);
});
watch([searchKeyword, filterDate, filterProgress, selectedSegmen], () => {
  currentPage.value = 1;
});

const openDeleteModal = (id) => {
  selectedId.value = id;
  showDeleteModal.value = true;
};

const addHotel = () => {
  form.value.hotel.push("");
};

const removeHotel = (index) => {
  form.value.hotel.splice(index, 1);
};

const showHotelModal = ref(false);
const selectedHotels = ref([]);

const openHotelModal = (hotelStr) => {
  if (hotelStr.includes(",")) {
    selectedHotels.value = hotelStr.split(","); // lebih dari 1 hotel
  } else {
    selectedHotels.value = [hotelStr]; // satu hotel tetap dibuat array
  }
  showHotelModal.value = true;
};
</script>

<template>
  <div class="container p-4 max-w-sm md:max-w-3xl lg:max-w-6xl mx-auto">
    <h2
      class="text-xl font-bold mb-2 text-slate-800 tracking-tight flex items-center gap-2"
    >
      New Customer
    </h2>
    <p class="text-md mb-6 text-slate-600">
      See all deal, new customer, new chat, and summary report
    </p>

    <!-- Filter -->
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

      <!-- Progress dropdown -->
      <div class="relative" id="progress-dropdown">
        <button
          @click.stop="openOnlyProgress()"
          class="w-full border border-slate-300 rounded-lg px-3 py-2 flex items-center justify-between"
        >
          <div class="flex items-center gap-2">
            <Filter class="w-4 h-4 text-slate-500" />
            <span class="text-slate-700 capitalize">{{
              filterProgress === "all" ? "All Progress" : filterProgress
            }}</span>
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
              class="px-3 py-2 hover:bg-blue-50 cursor-pointer"
              @click="selectProgress('on progress')"
            >
              On Progress
            </div>
            <div
              class="px-3 py-2 hover:bg-blue-50 cursor-pointer"
              @click="selectProgress('deal')"
            >
              Deal
            </div>
            <div
              class="px-3 py-2 hover:bg-blue-50 cursor-pointer"
              @click="selectProgress('canceled')"
            >
              Canceled
            </div>
          </div>
        </transition>
      </div>

      <!-- Segmen dropdown -->
      <div class="relative" id="segmen-dropdown">
        <button
          @click.stop="openOnlySegmen()"
          class="w-full border border-slate-300 rounded-lg px-3 py-2 flex items-center justify-between"
        >
          <div class="flex items-center gap-2">
            <Filter class="w-4 h-4 text-slate-500" />
            <span class="text-slate-700 capitalize">{{
              selectedSegmen === "all" ? "All Segmen" : selectedSegmen
            }}</span>
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
              v-for="segment in uniqueSegmens"
              :key="segment"
              class="px-3 py-2 hover:bg-blue-50 cursor-pointer capitalize"
              @click="selectSegmen(segment)"
            >
              {{ segment }}
            </div>
          </div>
        </transition>
      </div>

      <!-- Actions: Add + Reset -->
      <div class="flex items-center gap-2">
        <button
          @click="openCreateModal"
          class="w-full bg-slate-600 hover:bg-slate-700 text-white font-medium py-2 rounded-lg"
        >
          Add New Customer
        </button>
      </div>

      <div class="lg:col-span-5 flex gap-2 justify-end">
        <button
          @click="downloadCSV"
          class="bg-blue-900 text-white font-medium py-2 px-4 rounded-lg"
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
        class="min-w-full bg-white border border-slate-300 rounded-lg text-sm table-fixed"
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
            <th class="px-4 py-3 text-left w-[12%]">Notes</th>
            <th class="px-4 py-3 text-left w-[10%]">Actions</th>
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
              Data not found
            </td>
          </tr>
          <tr
            v-for="(c, i) in paginatedDataCustomers"
            :key="c.id"
            class="border-b border-slate-200 hover:bg-blue-50 transition-colors"
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
                  'inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-semibold w-28',
                  progressColor(c.progress),
                ]"
                >{{ c.progress }}</span
              >
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
            <td class="px-4 py-3 text-left">
              <button
                @click="openHotelModal(c.hotel)"
                class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm hover:bg-blue-200"
              >
                View
              </button>
            </td>

            <!-- Modal -->
            <div
              v-if="showHotelModal"
              class="fixed inset-0 flex items-center justify-center z-50 bg-black/50"
            >
              <div class="bg-white rounded-lg shadow-lg w-80 p-4 relative">
                <button
                  @click="showHotelModal = false"
                  class="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
                <h3 class="text-lg font-bold mb-3">Hotels</h3>
                <ul
                  class="list-disc list-inside space-y-1 max-h-60 overflow-y-auto"
                >
                  <li v-for="(h, index) in selectedHotels" :key="index">
                    {{ h.trim() }}
                  </li>
                </ul>
              </div>
            </div>

            <td class="px-4 py-3 align-middle text-left">{{ c.notes }}</td>
            <td class="px-4 py-3 align-middle text-left whitespace-nowrap">
              <div class="flex items-center gap-2">
                <!-- Button Edit -->
                <button
                  v-if="canEdit"
                  @click="openEditModal(c)"
                  class="bg-white border border-slate-200 hover:bg-slate-100 px-2 py-2 rounded-md shadow flex items-center justify-center"
                >
                  <Pencil class="w-4 h-4 text-orange-500" />
                </button>

                <!-- Button Delete -->
                <button
                  v-if="canEdit"
                  @click="openDeleteModal(c.id)"
                  class="bg-white border border-slate-200 hover:bg-slate-100 px-2 py-2 rounded-md shadow flex items-center justify-center"
                >
                  <Trash2 class="w-4 h-4 text-red-600" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal delete -->
    <ConfirmModal
      :show="showDeleteModal"
      title="Hapus Data"
      message="Apakah Anda yakin ingin menghapus data ini?"
      cancelText="Tidak"
      confirmText="Ya"
      @cancel="showDeleteModal = false"
      @confirm="confirmDelete"
    />

    <!-- Pagination -->
    <TablePagination
      :current-page="currentPage"
      :total-items="totalItems"
      :page-size="pageSize"
      @update:page="(page) => (currentPage = page)"
    />

    <!-- MODAL -->
    <transition name="modal">
      <div
        v-if="showModal"
        class="fixed inset-0 z-50 flex items-center justify-center"
      >
        <div
          class="absolute inset-0 bg-black/50 backdrop-blur-sm"
          @click="closeModal"
        ></div>

        <div
          class="relative bg-white rounded-xl w-full max-w-3xl mx-4 shadow-xl overflow-hidden"
        >
          <div
            class="sticky top-0 bg-white px-6 py-4 flex items-center justify-between z-10"
          >
            <h3 class="text-lg font-semibold">
              {{ editId ? "Edit Customer" : "Create Customer" }}
            </h3>

            <button
              class="text-slate-700 hover:text-slate-800 text-lg"
              @click="closeModal"
            >
              ✕
            </button>
          </div>

          <div class="max-h-[70vh] overflow-y-auto px-6 py-4 hidden-scroll">
            <form @submit.prevent="submitForm" class="grid grid-cols-2 gap-4">
              <template v-if="loadingModal">
                <div
                  v-for="n in 14"
                  :key="'skeleton-' + n"
                  class="h-12 bg-slate-200 rounded animate-pulse"
                ></div>

                <div
                  class="col-span-2 h-24 bg-slate-200 rounded animate-pulse"
                ></div>
              </template>
              <template v-else>
                <div class="flex flex-col">
                  <label
                    class="flex items-center gap-1 mb-1 font-medium text-slate-700"
                  >
                    Date
                    <span class="text-red-500">*</span>
                  </label>

                  <input
                    v-model="form.date"
                    type="date"
                    class="p-3 rounded-lg border border-slate-300 ring-1 ring-blue-50 focus:outline-none"
                  />
                </div>

                <div class="flex flex-col mb-3">
                  <label
                    class="flex items-center gap-1 mb-1 font-medium text-slate-700"
                  >
                    Phone
                    <span class="text-red-500">*</span>
                  </label>

                  <input
                    v-model="form.phone"
                    placeholder="Phone"
                    class="p-3 rounded-lg border border-slate-300 ring-1 ring-blue-50 focus:outline-none"
                  />
                </div>
                <div class="flex flex-col mb-3">
                  <label
                    class="flex items-center gap-1 mb-1 font-medium text-slate-700"
                  >
                    Customer Name
                    <span class="text-red-500">*</span>
                  </label>

                  <input
                    v-model="form.name"
                    placeholder="Customer Name"
                    class="p-3 rounded-lg border border-slate-300 ring-1 ring-blue-50 focus:outline-none"
                  />
                </div>

                <div class="flex flex-col mb-3">
                  <label
                    class="flex items-center gap-1 mb-1 font-medium text-slate-700"
                  >
                    Progress
                    <span class="text-red-500">*</span>
                  </label>

                  <!-- Progress -->
                  <div class="relative">
                    <div
                      @click="
                        showModalProgressDropdown = !showModalProgressDropdown
                      "
                      class="p-3 bg-white rounded-lg border border-slate-300 cursor-pointer select-none focus:outline-none flex items-center justify-between"
                    >
                      <span class="text-slate-700">
                        {{ form.progress || "Select progress" }}
                      </span>
                      <ChevronRight
                        class="w-4 h-4 text-slate-500 transform transition-transform duration-200"
                        :class="
                          showModalProgressDropdown ? 'rotate-90' : 'rotate-0'
                        "
                      />
                    </div>

                    <ul
                      v-if="showModalProgressDropdown"
                      class="absolute left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-slate-200 z-50"
                    >
                      <li
                        v-for="option in progressOptions"
                        :key="option"
                        @click="selectModalProgress(option)"
                        class="px-4 py-2 hover:bg-blue-50 cursor-pointer text-slate-700"
                      >
                        {{ option }}
                      </li>
                    </ul>
                  </div>
                </div>

                <!-- PIC -->
                <div class="flex flex-col mb-3">
                  <label
                    class="flex items-center gap-1 mb-1 font-medium text-slate-700"
                  >
                    PIC <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="form.pic"
                    placeholder="PIC"
                    class="p-3 rounded-lg border border-slate-300 ring-1 ring-blue-50 bg-slate-100 cursor-not-allowed focus:outline-none"
                    readonly
                  />
                </div>

                <!-- Segmen -->
                <div class="flex flex-col mb-3">
                  <label
                    class="flex items-center gap-1 mb-1 font-medium text-slate-700"
                  >
                    Segmen <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="form.segmen"
                    placeholder="Segmen"
                    class="p-3 rounded-lg border border-slate-300 ring-1 ring-blue-50 focus:outline-none"
                  />
                </div>

                <!-- Via -->
                <div class="flex flex-col mb-3">
                  <label
                    class="flex items-center gap-1 mb-1 font-medium text-slate-700"
                  >
                    Via <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="form.via"
                    placeholder="Via"
                    class="p-3 rounded-lg border border-slate-300 ring-1 ring-blue-50 focus:outline-none"
                  />
                </div>

                <!-- Country -->
                <div class="flex flex-col mb-3">
                  <label
                    class="flex items-center gap-1 mb-1 font-medium text-slate-700"
                  >
                    Country <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="form.country"
                    placeholder="Country"
                    class="p-3 rounded-lg border border-slate-300 ring-1 ring-blue-50 focus:outline-none"
                  />
                </div>

                <!-- Social Media -->
                <div class="flex flex-col mb-3">
                  <label
                    class="flex items-center gap-1 mb-1 font-medium text-slate-700"
                  >
                    Social Media ID <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="form.social_media_id"
                    placeholder="Social Media ID"
                    class="p-3 rounded-lg border border-slate-300 ring-1 ring-blue-50 focus:outline-none"
                  />
                </div>

                <!-- Tour Packages -->
                <div class="flex flex-col mb-3">
                  <label
                    class="flex items-center gap-1 mb-1 font-medium text-slate-700"
                  >
                    Tour Packages <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="form.tour_packages"
                    placeholder="Tour Packages"
                    class="p-3 rounded-lg border border-slate-300 ring-1 ring-blue-50 focus:outline-none"
                  />
                </div>

                <!-- Check In -->
                <div class="flex flex-col mb-3">
                  <label
                    class="flex items-center gap-1 mb-1 font-medium text-slate-700"
                  >
                    Check In <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="form.check_in"
                    type="date"
                    class="p-3 rounded-lg border border-slate-300 ring-1 ring-blue-50 focus:outline-none"
                  />
                </div>

                <!-- Check Out -->
                <div class="flex flex-col mb-3">
                  <label
                    class="flex items-center gap-1 mb-1 font-medium text-slate-700"
                  >
                    Check Out <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="form.check_out"
                    type="date"
                    class="p-3 rounded-lg border border-slate-300 ring-1 ring-blue-50 focus:outline-none"
                  />
                </div>

                <!-- Hotel -->
                <!-- Hotel -->
                <div class="flex flex-col mb-3">
                  <label
                    class="flex items-center gap-1 mb-1 font-medium text-slate-700"
                  >
                    Hotel <span class="text-red-500">*</span>
                  </label>

                  <div
                    v-for="(h, index) in form.hotel"
                    :key="index"
                    class="flex gap-2 mb-2"
                  >
                    <input
                      v-model="form.hotel[index]"
                      placeholder="Hotel"
                      class="p-3 rounded-lg border border-slate-300 ring-1 ring-blue-50 focus:outline-none flex-1"
                    />
                    <button
                      type="button"
                      @click="removeHotel(index)"
                      class="px-3 py-1 bg-red-500 text-white rounded"
                      v-if="form.hotel.length > 1"
                    >
                      -
                    </button>
                  </div>

                  <button
                    type="button"
                    @click="addHotel"
                    class="px-3 py-1 bg-blue-500 text-white rounded"
                  >
                    + Tambah Hotel
                  </button>
                </div>

                <!-- Notes -->
                <div class="flex flex-col mb-3 col-span-2">
                  <label
                    class="flex items-center gap-1 mb-1 font-medium text-slate-700"
                  >
                    Notes <span class="text-red-500">*</span>
                  </label>
                  <textarea
                    v-model="form.notes"
                    class="min-h-[100px] p-3 rounded-lg border border-slate-300 ring-1 ring-blue-50 focus:outline-none"
                    placeholder="Notes"
                  ></textarea>
                </div>
              </template>

              <!-- Footer -->
              <div class="col-span-2 flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  class="border border-blue-900 text-slate-600 hover:bg-blue-50 font-medium px-5 py-2 rounded-lg"
                  @click="closeModal"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  class="bg-blue-900 hover:bg-blue-900/90 text-white font-medium px-4 py-2 rounded-lg flex items-center gap-2"
                  :disabled="loadingModal"
                >
                  <span v-if="loadingModal" class="animate-pulse"
                    >Loading...</span
                  >
                  <span v-else>
                    {{ editId ? "Update New Customer" : "Create New Customer" }}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </transition>
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

.modal-enter-active,
.modal-leave-active {
  transition: all 0.18s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.99);
}
.modal-enter-to,
.modal-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
.slide-fade-enter-to,
.slide-fade-leave-from {
  opacity: 1;
  transform: translateY(0);
}
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.2s ease;
}

.rotate-enter-from,
.rotate-leave-to {
  opacity: 0;
  transform: rotate(-90deg);
}
.rotate-enter-to,
.rotate-leave-from {
  opacity: 1;
  transform: rotate(0deg);
}
.rotate-enter-active,
.rotate-leave-active {
  transition: all 0.3s ease;
}
</style>
