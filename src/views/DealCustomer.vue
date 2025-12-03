<script setup>
import {
  Search,
  Calendar,
  Filter,
  ChevronDown,
  Pencil,
  Trash2,
  RotateCcw,
} from "lucide-vue-next";
import ConfirmModal from "@/components/ConfirmModalDelete.vue";
import TablePagination from "../components/TablePagination.vue";
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import api from "../api/api";

// State
const selectedCustomer = ref(null);
const deals = ref([]);
const newCustomers = ref([]);
const searchKeyword = ref("");
const filterDate = ref("");
const filterProgress = ref("all");
const selectedSegmen = ref("all");

// Indikator laoding button save
const isLoading = ref(false);

// dropdown state
const customerDropdownRef = ref(null);
const showProgressDropdown = ref(false);
const showSegmenDropdown = ref(false);

// dropdown select customer
const showCustomerDropdown = ref(false);
const selectedCustomerText = ref("");

// Batal edit
const isEditing = ref(false);
const originalDealData = ref(null);

// alert button save dan edit
const alertMessage = ref("");
const alertType = ref("");
const showAlert = ref(false);

// loading tabel
const loading = ref(false);

// Paginasi
const currentPage = ref(1);
const pageSize = ref(10);
const totalItems = ref(0);

const dealForm = ref({
  id: null,
  new_customer_id: "",
  handler: "",
  link_drive: "",
  total_pax: "",
  activity: "",
  payment_status: null,
});

// Modal delete
const showDeleteModal = ref(false);
const selectedId = ref(null);

const loadData = async () => {
  try {
    const nc = await api.get("/new-customer");
    newCustomers.value = nc.data.data || [];

    loading.value = true;
    try {
      const dc = await api.get("/deal-customer");
      deals.value = dc.data.data || [];
    } catch (err) {
      console.error("Error fetching deal customers:", err);
      deals.value = [];
    } finally {
      loading.value = false;
    }
  } catch (err) {
    console.error("Error fetching new customers:", err);
    newCustomers.value = [];
  }
};

const onSelectCustomer = () => {
  selectedCustomer.value = newCustomers.value.find(
    (c) => c.id == dealForm.value.new_customer_id
  );
};

const handleSave = async () => {
  const fd = new FormData();
  isLoading.value = true;

  Object.keys(dealForm.value).forEach((key) => {
    if (key === "payment_status" && dealForm.value[key] === null) return;
    fd.append(key, dealForm.value[key]);
  });

  try {
    if (!dealForm.value.id) {
      await api.post("/deal-customer", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    } else {
      await api.post(`/deal-customer/${dealForm.value.id}?_method=PUT`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }

    alertType.value = "success";
    alertMessage.value = "Data berhasil disimpan!";
    showAlert.value = true;
  } catch (error) {
    alertType.value = "error";
    alertMessage.value = "Terjadi kesalahan. Gagal menyimpan data!";
    showAlert.value = true;
  } finally {
    isLoading.value = false;
  }

  reset();
  loadData();
};

// Edit
const editDeal = (d) => {
  originalDealData.value = JSON.parse(JSON.stringify(d));

  dealForm.value = {
    id: d.id,
    new_customer_id: d.new_customer_id,
    handler: d.handler,
    link_drive: d.link_drive,
    total_pax: d.total_pax,
    activity: d.activity,
    payment_status: null,
  };

  selectedCustomer.value = d.new_customer;
  selectedCustomerText.value = `${d.new_customer.name} — (${d.new_customer.phone})`;
  isEditing.value = true;
};

const confirmDelete = async () => {
  try {
    await api.delete(`/deal-customer/${selectedId.value}`);
    await loadData();
  } catch (error) {
    console.error("Gagal menghapus data:", error);
    alert("Terjadi kesalahan saat menghapus data.");
  } finally {
    showDeleteModal.value = false;
  }
};

const reset = () => {
  dealForm.value = {
    id: null,
    new_customer_id: "",
    handler: "",
    link_drive: "",
    total_pax: "",
    activity: "",
    payment_status: null,
  };
  selectedCustomer.value = null;
};
onMounted(loadData);

const filteredDeals = computed(() => {
  return deals.value.filter((d) => {
    const c = d.new_customer;
    if (!c) return false;

    const keyword = searchKeyword.value.toLowerCase();
    const allFields = [
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
      d.handler,
      d.link_drive,

      c.via,
      d.social_media_id,
      d.notes,

      String(d.total_pax),
      d.activity,
      d.payment_status ? d.payment_status.name || String(d.payment_status) : "",
    ].map((f) => f?.toLowerCase() || "");

    const matchesKeyword = allFields.some((f) => f.includes(keyword));

    // Date filter
    const matchesDate = filterDate.value ? c.date === filterDate.value : true;

    // Progress filter
    const matchesProgress =
      filterProgress.value && filterProgress.value !== "all"
        ? c.progress === filterProgress.value
        : true;

    // Segment filter
    const matchesSegmen =
      selectedSegmen.value && selectedSegmen.value !== "all"
        ? c.segmen.toLowerCase() === selectedSegmen.value.toLowerCase()
        : true;

    return matchesKeyword && matchesDate && matchesProgress && matchesSegmen;
  });
});

const uniqueSegmens = computed(() => {
  const segmens = new Set();
  deals.value.forEach((d) => {
    const c = d.new_customer;
    if (c && c.segmen) segmens.add(c.segmen);
  });
  return Array.from(segmens);
});

const downloadCSV = () => {
  const headers = [
    "Customer Name",
    "PIC",
    "Date",
    "Phone",
    "Progress",
    "Segmen",
    "Country",
    "Tour Packages",
    "Check In",
    "Check Out",
    "Hotel",
    "Handler",
    "Link Drive",
    "Total Pax",
    "Activity",
    "Payment Status",
    "Via",
    "Social Media ID",
    "Notes",
  ];

  const rows = filteredDeals.value.map((d) => {
    const c = d.new_customer || {};

    return [
      c.name || "",
      c.pic || "",
      c.date || "",
      c.phone || "",
      c.progress || "",
      c.segmen || "",
      c.country || "",
      c.tour_packages || "",
      c.check_in || "",
      c.check_out || "",
      c.hotel || "",

      d.handler || "",
      d.link_drive || "",
      d.total_pax ?? "",
      d.activity || "",
      d.payment_status?.name || d.payment_status || "",

      c.via || "",
      c.social_media_id || "",
      c.notes || "",
    ];
  });

  const csvContent =
    "data:text/csv;charset=utf-8," +
    [headers, ...rows].map((e) => e.join(",")).join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "deal_customers.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Reset Filters
const resetFilters = () => {
  searchKeyword.value = "";
  filterDate.value = "";
  filterProgress.value = "all";
  selectedSegmen.value = "all";
};

const openOnlyProgress = () => {
  showProgressDropdown.value = !showProgressDropdown.value;
  showSegmenDropdown.value = false;
};

const openOnlySegmen = () => {
  showSegmenDropdown.value = !showSegmenDropdown.value;
  showProgressDropdown.value = false;
};

const closeAllDropdowns = () => {
  showProgressDropdown.value = false;
  showSegmenDropdown.value = false;
};

// select progress
const selectProgress = (val) => {
  filterProgress.value = val;
  showProgressDropdown.value = false;
};
// select segmen
const selectSegmen = (val) => {
  selectedSegmen.value = val;
  showSegmenDropdown.value = false;
};

onMounted(() => {
  window.addEventListener("click", () => {
    closeAllDropdowns();
  });
});

const progressColor = (status) => {
  if (!status) return "bg-slate-100 text-slate-600";

  const s = status.toString().trim().toUpperCase();

  switch (s) {
    case "NEW":
      return "bg-slate-200 text-slate-700";

    case "FOLLOW UP":
    case "FOLLOWUP":
      return "bg-yellow-200 text-yellow-800";

    case "PROSPECT":
      return "bg-blue-200 text-blue-800";

    case "DEAL":
      return "bg-green-200 text-green-800";

    case "LOST":
    case "CANCELED":
      return "bg-red-200 text-red-800";

    case "ON PROGRESS":
      return "bg-blue-200 text-blue-800";

    default:
      return "bg-slate-100 text-slate-600";
  }
};

const toggleCustomerDropdown = () => {
  closeAllDropdowns();
  showCustomerDropdown.value = !showCustomerDropdown.value;
};

const selectCustomer = (cust) => {
  if (!cust) {
    dealForm.value.new_customer_id = "";
    selectedCustomerText.value = "";
  } else {
    dealForm.value.new_customer_id = cust.id;
    selectedCustomerText.value = `${cust.name} — (${cust.phone})`;
    onSelectCustomer();
  }

  showCustomerDropdown.value = false;
};

const cancelEdit = () => {
  if (originalDealData.value) {
    dealForm.value = {
      id: originalDealData.value.id,
      new_customer_id: originalDealData.value.new_customer_id,
      handler: originalDealData.value.handler,
      link_drive: originalDealData.value.link_drive,
      total_pax: originalDealData.value.total_pax,
      activity: originalDealData.value.activity,
      payment_status: null,
    };

    selectedCustomer.value = originalDealData.value.new_customer;
    selectedCustomerText.value = `${originalDealData.value.new_customer.name} — (${originalDealData.value.new_customer.phone})`;
  }
  reset();
  isEditing.value = false;
  originalDealData.value = null;
};

const handleDropdownOutside = (event) => {
  if (
    customerDropdownRef.value &&
    !customerDropdownRef.value.contains(event.target)
  ) {
    showCustomerDropdown.value = false;
  }
};
onMounted(() => {
  window.addEventListener("click", handleDropdownOutside);
});

onBeforeUnmount(() => {
  window.removeEventListener("click", handleDropdownOutside);
});

const progressWidthModal = (progress) => {
  const p = (progress || "").toLowerCase();
  if (p === "deal") return "100%";
  if (p === "on progress") return "60%";
  if (p === "canceled") return "30%";
  return "40%";
};

const paginatedDataCustomers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  totalItems.value = filteredDeals.value.length;
  return filteredDeals.value.slice(start, end);
});
watch([searchKeyword, filterDate, filterProgress, selectedSegmen], () => {
  currentPage.value = 1;
});

const openDeleteModal = (id) => {
  selectedId.value = id;
  showDeleteModal.value = true;
};
</script>

<template>
  <div class="container p-4 max-w-sm md:max-w-3xl lg:max-w-6xl mx-auto">
    <transition
      enter-from-class="opacity-0 -translate-y-2"
      enter-active-class="transition-all duration-300"
      enter-to-class="opacity-100 translate-y-0"
      leave-from-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-300"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div
        v-if="showAlert"
        :class="
          alertType === 'success'
            ? 'bg-blue-900 text-white'
            : 'bg-red-600 text-white'
        "
        class="fixed top-12 left-1/2 -translate-x-1/2 px-5 py-3 rounded-lg shadow-lg text-sm font-medium z-50"
      >
        {{ alertMessage }}
      </div>
    </transition>

    <h2
      class="text-xl font-bold mb-2 text-slate-800 tracking-tight flex items-center gap-2"
    >
      Deal Customer
    </h2>
    <p class="text-md mb-6 text-slate-600">
      See all deal customer, and summary report
    </p>
    <!-- Form deal customer -->
    <div class="bg-white rounded-xl shadow border border-slate-200 p-6 mb-8">
      <h3 class="text-lg font-semibold mb-4 text-slate-700">
        Form Deal Customer
      </h3>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-5 text-[15px]">
        <!-- Select Customer -->
        <div
          class="col-span-2 relative"
          id="customer-dropdown"
          ref="customerDropdownRef"
        >
          <label class="font-semibold text-slate-700">Select Customer</label>

          <button
            @click.stop="toggleCustomerDropdown"
            class="mt-1 w-full bg-white/80 backdrop-blur-xl border border-slate-300 rounded-lg px-4 py-3 flex items-center justify-between hover:shadow-md transition-all"
          >
            <span class="text-slate-700 font-medium">
              {{ selectedCustomerText || "Pilih Customer..." }}
            </span>
            <ChevronDown class="w-5 h-5 text-slate-500" />
          </button>

          <transition name="dropdown">
            <div
              v-if="showCustomerDropdown"
              class="absolute z-20 mt-1 w-full bg-white backdrop-blur-xl border border-slate-200 rounded-lg shadow-md max-h-60 overflow-y-auto hidden-scroll"
            >
              <div
                class="px-4 py-3 hover:bg-red-50/60 cursor-pointer flex justify-between text-red-700 font-semibold"
                @click="selectCustomer(null)"
              >
                Batal
              </div>

              <div
                v-for="nc in newCustomers"
                :key="nc.id"
                class="px-4 py-3 hover:bg-blue-50 cursor-pointer flex justify-between text-slate-700"
                @click="selectCustomer(nc)"
              >
                <span class="font-medium">{{ nc.name }}</span>
                <span
                  :class="[
                    'inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-semibold w-24',
                    progressColor(nc.progress),
                  ]"
                >
                  {{ nc.progress }}
                </span>
              </div>
            </div>
          </transition>
        </div>

        <div
          v-if="selectedCustomer"
          class="col-span-2 bg-white/70 backdrop-blur-md border border-slate-200 p-5 rounded-md text-sm shadow"
        >
          <h4 class="font-semibold text-slate-800 mb-3 text-lg">
            Customer Details
          </h4>

          <div class="grid grid-cols-2 md:grid-cols-3 gap-3 text-slate-700">
            <p><b class="font-semibold">PIC:</b> {{ selectedCustomer.pic }}</p>
            <p>
              <b class="font-semibold">Date:</b> {{ selectedCustomer.date }}
            </p>
            <p>
              <b class="font-semibold">Phone:</b> {{ selectedCustomer.phone }}
            </p>
            <p>
              <b class="font-semibold">Customer Name:</b>
              {{ selectedCustomer.name }}
            </p>
            <p class="flex items-center gap-2">
              <b class="font-semibold">Progress:</b>

              <span
                :class="[
                  'inline-flex items-center justify-center px-5 py-1 rounded-full text-xs font-semibold',
                  progressColor(selectedCustomer.progress),
                ]"
              >
                {{ selectedCustomer.progress }}
              </span>
            </p>

            <div class="w-full bg-gray-200 rounded-full h-3 mt-1">
              <div
                :class="[
                  'h-3 rounded-full transition-all duration-300',
                  progressColor(selectedCustomer.progress),
                ]"
                :style="{
                  width: progressWidthModal(selectedCustomer.progress),
                }"
              ></div>
            </div>

            <p>
              <b class="font-semibold">Segmen:</b> {{ selectedCustomer.segmen }}
            </p>
            <p>
              <b class="font-semibold">Country:</b>
              {{ selectedCustomer.country }}
            </p>
            <p>
              <b class="font-semibold">Tour Packages:</b>
              {{ selectedCustomer.tour_packages }}
            </p>
            <p>
              <b class="font-semibold">Check In:</b>
              {{ selectedCustomer.check_in }}
            </p>
            <p>
              <b class="font-semibold">Check Out:</b>
              {{ selectedCustomer.check_out }}
            </p>
            <p>
              <b class="font-semibold">Hotel:</b> {{ selectedCustomer.hotel }}
            </p>
            <p><b class="font-semibold">Via:</b> {{ selectedCustomer.via }}</p>
            <p>
              <b class="font-semibold">Social Media:</b>
              {{ selectedCustomer.social_media_id }}
            </p>
            <p>
              <b class="font-semibold">Note:</b>
              {{ selectedCustomer.notes }}
            </p>
          </div>
        </div>

        <div>
          <label class="font-semibold text-slate-700">Handler</label>
          <input
            v-model="dealForm.handler"
            class="w-full border-[1.5px] border-slate-200 rounded-lg p-3 mt-1 focus:border-slate-300 outline-none transition-all bg-white/80 backdrop-blur"
            placeholder="Handler"
          />
        </div>

        <div>
          <label class="font-semibold text-slate-700">Link Drive</label>
          <input
            v-model="dealForm.link_drive"
            class="w-full border-[1.5px] border-slate-200 rounded-lg p-3 mt-1 focus:border-slate-300 outline-none transition-all bg-white/80 backdrop-blur"
            placeholder="Link Drive"
          />
        </div>

        <div>
          <label class="font-semibold text-slate-700">Total Pax</label>
          <input
            v-model="dealForm.total_pax"
            type="number"
            class="w-full border-[1.5px] border-slate-200 rounded-lg p-3 mt-1 focus:border-slate-300 outline-none transition-all bg-white/80 backdrop-blur"
            placeholder="Total Pax"
          />
        </div>

        <div>
          <label class="font-semibold text-slate-700">Activity</label>
          <input
            v-model="dealForm.activity"
            class="w-full border-[1.5px] border-slate-200 rounded-lg p-3 mt-1 focus:border-slate-300 outline-none transition-all bg-white/80 backdrop-blur"
            placeholder="Activity"
          />
        </div>

        <div class="col-span-2">
          <label class="font-semibold text-slate-700"
            >Payment Status (Upload)</label
          >
          <input
            type="file"
            @change="(e) => (dealForm.payment_status = e.target.files[0])"
            class="w-full border-[1.5px] border-slate-200 rounded-lg p-3 mt-1 focus:border-slate-300 outline-none transition-all bg-white/80 backdrop-blur"
          />
        </div>
      </div>

      <!-- Save -->
      <div class="text-[15px] flex gap-2 justify-end mt-4">
        <button
          @click="handleSave"
          :disabled="isLoading"
          class="px-4 py-2 bg-blue-900 text-white rounded-lg flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          <svg
            v-if="isLoading"
            class="w-5 h-5 animate-spin text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            ></path>
          </svg>
          {{ isLoading ? "Memproses..." : isEditing ? "Update" : "Save" }}
        </button>
        <button
          v-if="isEditing"
          @click="cancelEdit"
          class="px-4 py-2 bg-gray-500 text-white rounded-lg"
        >
          Batal Edit
        </button>
      </div>
    </div>

    <!--Filter Bar -->
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
          placeholder="Search"
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

      <!-- Progress Dropdown -->
      <div class="relative" id="progress-dropdown">
        <button
          @click.stop="openOnlyProgress()"
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
              v-for="prog in ['on progress', 'deal', 'canceled']"
              :key="prog"
              class="px-3 py-2 hover:bg-blue-50 cursor-pointer capitalize"
              @click="selectProgress(prog)"
            >
              {{ prog }}
            </div>
          </div>
        </transition>
      </div>

      <!-- Segmen Dropdown -->
      <div class="relative" id="segmen-dropdown">
        <button
          @click.stop="openOnlySegmen()"
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
            <th class="px-4 py-3 text-left w-[10%]">Phone</th>
            <th class="px-4 py-3 text-left w-[12%]">Customer Name</th>
            <th class="px-4 py-3 text-left w-[10%]">Progress</th>
            <th class="px-4 py-3 text-left w-[8%]">PIC</th>
            <th class="px-4 py-3 text-left w-[8%]">Segmen</th>
            <th class="px-4 py-3 text-left w-[10%]">via</th>
            <th class="px-4 py-3 text-left w-[8%]">Country</th>
            <th class="px-4 py-3 text-left w-[10%]">Social Media</th>
            <th class="px-4 py-3 text-left w-[12%]">Tour Packages</th>
            <th class="px-4 py-3 text-left w-[8%]">Check In</th>
            <th class="px-4 py-3 text-left w-[8%]">Check Out</th>
            <th class="px-4 py-3 text-left w-[10%]">Hotel</th>
            <th class="px-4 py-3 text-left w-[10%]">Handler</th>
            <th class="px-4 py-3 text-left w-[12%]">Link Drive</th>
            <th class="px-4 py-3 text-left w-[8%]">Total Pax</th>
            <th class="px-4 py-3 text-left w-[10%]">Activity</th>
            <th class="px-4 py-3 text-left w-[10%]">Payment Satus</th>
            <th class="px-4 py-3 text-left w-[10%]">Notes</th>
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
          <tr v-else-if="!loading && filteredDeals.length === 0">
            <td
              colspan="15"
              class="text-center p-4 text-gray-800 font-semibold"
            >
              Data not found
            </td>
          </tr>
          <tr
            v-for="(d, i) in paginatedDataCustomers"
            :key="d.id"
            class="border-b border-slate-200 hover:bg-blue-50 transition-colors"
          >
            <!-- Customer -->
            <td class="px-4 py-2">{{ i + 1 }}</td>
            <td class="px-4 py-3 whitespace-nowrap">
              {{ d.new_customer?.date }}
            </td>
            <td class="px-4 py-3 whitespace-nowrap">
              {{ d.new_customer?.phone }}
            </td>
            <td class="px-4 py-3 align-middle text-left whitespace-nowrap">
              {{ d.new_customer?.name }}
            </td>
            <!-- Progress badge -->
            <td class="px-4 py-3">
              <span
                :class="[
                  'inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-semibold w-28',
                  progressColor(d.new_customer?.progress),
                ]"
              >
                {{ d.new_customer?.progress }}
              </span>
            </td>
            <td class="px-4 py-3 whitespace-nowrap">
              {{ d.new_customer?.pic }}
            </td>
            <td class="px-4 py-3">{{ d.new_customer?.segmen }}</td>
            <td>{{ d.new_customer.via }}</td>
            <td class="px-4 py-3 whitespace-nowrap">
              {{ d.new_customer?.country }}
            </td>
            <td class="px-4 py-3 align-middle text-left whitespace-nowrap">
              <a
                :href="d.new_customer?.social_media_id"
                target="_blank"
                class="text-blue-600 underline hover:text-blue-800"
              >
                {{ d.new_customer?.social_media_id }}
              </a>
            </td>
            <td class="px-4 py-3">{{ d.new_customer?.tour_packages }}</td>
            <td class="px-4 py-3 whitespace-nowrap">
              {{ d.new_customer?.check_in }}
            </td>
            <td class="px-4 py-3 whitespace-nowrap">
              {{ d.new_customer?.check_out }}
            </td>
            <td class="px-4 py-3">{{ d.new_customer?.hotel }}</td>
            <td class="px-4 py-3">{{ d.handler }}</td>
            <td class="px-4 py-3">{{ d.link_drive }}</td>
            <td class="px-4 py-3">{{ d.total_pax }}</td>
            <td class="px-4 py-3">{{ d.activity }}</td>
            <td class="px-4 py-3">{{ d.payment_status }}</td>
            <td>{{ d.new_customer.notes }}</td>

            <td class="px-4 py-3 whitespace-nowrap">
              <div class="flex items-center gap-2">
                <button
                  @click="editDeal(d)"
                  class="bg-white border border-slate-200 hover:bg-slate-100 px-2 py-2 rounded-md shadow flex items-center justify-center"
                >
                  <Pencil class="w-4 h-4 text-orange-500" />
                </button>
                <button
                  @click="openDeleteModal(d.id)"
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

.dropdown-enter-from {
  opacity: 0;
  transform: translateY(-4px);
}

.dropdown-enter-to {
  opacity: 1;
  transform: translateY(0);
}

.dropdown-leave-from {
  opacity: 1;
  transform: translateY(0);
}

.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
