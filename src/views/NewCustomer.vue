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
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import api from "../api/api";
import { useAuthStore } from "../stores/auth.js";

// ----- AUTH STORE -----
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

// ----- STATE -----
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

// modal & form
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
  hotel: "",
  notes: "",
});

// dropdown state
const showProgressDropdown = ref(false);
const showModalProgressDropdown = ref(false);
const showSegmenDropdown = ref(false);

// loading tabel
const loading = ref(false);

// ------- API CALLS -------
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
  try {
    if (editId.value) {
      await api.put(`/new-customer/${editId.value}`, form.value);
    } else {
      await api.post("/new-customer", form.value);
    }
    resetForm();
    await getNewCustomers();
    await getSummary();
    closeModal();
  } catch (err) {
    console.error("Error submitting form:", err);
  }
};

const deleteNewCustomer = async (id) => {
  try {
    if (!confirm("Are you sure?")) return;
    await api.delete(`/new-customer/${id}`);
    await getNewCustomers();
    await getSummary();
  } catch (err) {
    console.error("Error deleting customer:", err);
  }
};

// ------- FILTERS / COMPUTED -------
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
        ? c.progress === filterProgress.value
        : true;
    const matchesSegmen =
      selectedSegmen.value && selectedSegmen.value !== "all"
        ? (c.segmen || "").toLowerCase() === selectedSegmen.value.toLowerCase()
        : true;

    return matchesKeyword && matchesDate && matchesProgress && matchesSegmen;
  });
});

const uniqueSegmens = computed(() => {
  const seg = new Set();
  newCustomers.value.forEach((c) => {
    if (c.segmen) seg.add(c.segmen);
  });
  return Array.from(seg);
});

// ------- UI Helpers -------
const progressClass = (progress) => {
  const p = (progress || "").toString().toLowerCase();
  if (p === "deal")
    return "bg-green-100 text-green-800 border border-green-200";
  if (p === "on progress")
    return "bg-blue-100 text-blue-800 border border-blue-200";
  if (p === "canceled") return "bg-red-100 text-red-800 border border-red-200";
  return "bg-slate-100 text-slate-700 border border-slate-200";
};

// ------- MODAL / FORM HELPERS -------
const openCreateModal = () => {
  resetForm();
  editId.value = null;
  showModal.value = true;
};

const openEditModal = (customer) => {
  editId.value = customer.id;
  Object.keys(form.value).forEach((k) => (form.value[k] = customer[k] ?? ""));
  showModal.value = true;
};

const resetForm = () => {
  Object.keys(form.value).forEach((k) => (form.value[k] = ""));
  editId.value = null;
};

const closeModal = () => {
  showModal.value = false;
  resetForm();
};

// ------- DROPDOWN HELPERS -------
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

// ------- CSV Download -------
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

// ------- CLICK OUTSIDE HANDLER -------
function handleClickOutside(e) {
  const progress = document.getElementById("progress-dropdown");
  const segmen = document.getElementById("segmen-dropdown");

  if (progress && !progress.contains(e.target))
    showProgressDropdown.value = false;
  if (segmen && !segmen.contains(e.target)) showSegmenDropdown.value = false;
}

// ------- LIFECYCLE -------
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

// Reset semua filter
function resetFilters() {
  searchKeyword.value = "";
  filterDate.value = "";
  filterProgress.value = "all";
  selectedSegmen.value = "all";
}
</script>

<template>
  <div class="p-5 max-w-6xl mx-auto">
    <!-- TITLE -->
    <h2
      class="text-xl font-bold mb-2 text-slate-800 tracking-tight flex items-center gap-2"
    >
      New Customer
    </h2>
    <p class="text-md mb-6 text-slate-600">
      See all deal, new customer, new chat, and summary report
    </p>

    <!-- FILTERS & ACTIONS -->
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
            class="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden"
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
          Add Customer
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
            <th class="px-4 py-3 text-left w-[10%]">Actions</th>
          </tr>
        </thead>

        <tbody>
          <tr v-if="loading">
            <td colspan="15" class="text-center p-4">Loading...</td>
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
            v-for="c in filteredCustomers"
            :key="c.id"
            class="border-b border-slate-200 hover:bg-blue-50 transition-colors"
          >
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
                  progressClass(c.progress),
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
                  @click="deleteNewCustomer(c.id)"
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

    <!-- MODAL (Create / Edit) -->
    <transition name="modal">
      <div
        v-if="showModal"
        class="fixed inset-0 z-50 flex items-center justify-center"
      >
        <!-- Overlay -->
        <div
          class="absolute inset-0 bg-black/50 backdrop-blur-sm"
          @click="closeModal"
        ></div>

        <!-- Modal -->
        <div
          class="relative bg-white rounded-xl w-full max-w-3xl mx-4 shadow-xl overflow-hidden"
        >
          <!-- Header -->
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

          <!-- Body -->
          <div class="max-h-[70vh] overflow-y-auto px-6 py-4 hidden-scroll">
            <form @submit.prevent="submitForm" class="grid grid-cols-2 gap-4">
              <input
                v-model="form.date"
                type="date"
                placeholder="Date"
                class="p-3 rounded-lg border border-slate-300 ring-1 ring-blue-50 focus:outline-none"
              />
              <input
                v-model="form.phone"
                placeholder="Phone"
                class="p-3 rounded-lg border border-slate-300 ring-1 ring-blue-50 focus:outline-none"
              />
              <input
                v-model="form.name"
                placeholder="Customer Name"
                class="p-3 rounded-lg border border-slate-300 ring-1 ring-blue-50 focus:outline-none"
              />
              <!-- PROGRESS DROPDOWN -->
              <div class="relative">
                <!-- Input Display -->
                <div
                  @click="
                    showModalProgressDropdown = !showModalProgressDropdown
                  "
                  class="p-3 bg-white rounded-lg border border-slate-300 cursor-pointer select-none focus:outline-none flex items-center justify-between"
                >
                  <span class="text-slate-700">
                    {{ form.progress || "Select progress" }}
                  </span>

                  <!-- ICON BERUBAH -->
                  <ChevronRight
                    class="w-4 h-4 text-slate-500 transform transition-transform duration-200"
                    :class="
                      showModalProgressDropdown ? 'rotate-90' : 'rotate-0'
                    "
                  />
                </div>

                <!-- Dropdown List -->
                <transition
                  enter-active-class="transition duration-200 ease-out"
                  enter-from-class="opacity-0 -translate-y-2"
                  enter-to-class="opacity-100 translate-y-0"
                  leave-active-class="transition duration-150 ease-in"
                  leave-from-class="opacity-100 translate-y-0"
                  leave-to-class="opacity-0 -translate-y-2"
                >
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
                </transition>
              </div>

              <input
                v-model="form.pic"
                placeholder="PIC"
                class="p-3 rounded-lg border border-slate-300 ring-1 ring-blue-50 focus:outline-none"
              />
              <input
                v-model="form.segmen"
                placeholder="Segmen"
                class="p-3 rounded-lg border border-slate-300 ring-1 ring-blue-50 focus:outline-none"
              />
              <input
                v-model="form.via"
                placeholder="Via"
                class="p-3 rounded-lg border border-slate-300 ring-1 ring-blue-50 focus:outline-none"
              />
              <input
                v-model="form.country"
                placeholder="Country"
                class="p-3 rounded-lg border border-slate-300 ring-1 ring-blue-50 focus:outline-none"
              />
              <input
                v-model="form.social_media_id"
                placeholder="Social Media ID"
                class="p-3 rounded-lg border border-slate-300 ring-1 ring-blue-50 focus:outline-none"
              />
              <input
                v-model="form.tour_packages"
                placeholder="Tour Packages"
                class="p-3 rounded-lg border border-slate-300 ring-1 ring-blue-50 focus:outline-none"
              />
              <input
                v-model="form.check_in"
                type="date"
                class="p-3 rounded-lg border border-slate-300 ring-1 ring-blue-50 focus:outline-none"
                placeholder="Check In"
              />
              <input
                v-model="form.check_out"
                type="date"
                class="p-3 rounded-lg border border-slate-300 ring-1 ring-blue-50 focus:outline-none"
                placeholder="Check Out"
              />
              <input
                v-model="form.hotel"
                placeholder="Hotel"
                class="p-3 rounded-lg border border-slate-300 ring-1 ring-blue-50 focus:outline-none"
              />

              <textarea
                v-model="form.notes"
                class="col-span-2 min-h-[100px] p-3 rounded-lg border border-slate-300 ring-1 ring-blue-50 focus:outline-none"
                placeholder="Notes"
              ></textarea>
            </form>
          </div>

          <!-- Footer -->
          <div
            class="sticky bottom-0 bg-white px-6 py-4 flex justify-end gap-3 z-10"
          >
            <button
              type="button"
              class="border border-blue-900 text-slate-600 hover:bg-blue-50 font-medium px-5 py-2 rounded-lg"
              @click="closeModal"
            >
              Cancel
            </button>

            <button
              type="submit"
              class="bg-blue-900 text-white font-medium px-4 py-2 rounded-lg"
              @click="submitForm"
            >
              {{ editId ? "Update Customer" : "Create Customer" }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
/* layout helpers */
.hidden-scroll {
  overflow: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.hidden-scroll::-webkit-scrollbar {
  display: none;
}

/* dropdown anim */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.15s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* modal anim */
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

/* transition for subtle slide/rotate if needed in sidebar (kept for consistency) */
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
