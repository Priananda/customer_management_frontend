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
const deals = ref([]); // raw deal-customer API (optional)
const newCustomers = ref([]); // raw new-customer API (optional)
const combinedData = ref([]); // [{ new_customer, deal_customer }]
const searchKeyword = ref("");
const filterDate = ref("");
const filterProgress = ref("all");
const selectedSegmen = ref("all");

// Indikator loading button save
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

// Search customer to select customer and animation
const customerSearch = ref("");
const focusInputSearch = ref(false);

const editFormNewCustomer = ref({
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
const deleteType = ref(null);

// load both endpoints and build combinedData
const loadData = async () => {
  loading.value = true;
  try {
    const [ncRes, dcRes] = await Promise.all([
      api.get("/new-customer"),
      api.get("/deal-customer"),
    ]);

    newCustomers.value = ncRes.data?.data || [];
    deals.value = dcRes.data?.data || [];

    // Build combinedData: every new_customer appears, with its deal (if any)
    combinedData.value = newCustomers.value.map((nc) => {
      const deal = deals.value.find((d) => {
        // deal might include new_customer inside, check both possibilities
        if (d.new_customer_id !== undefined) {
          return Number(d.new_customer_id) === Number(nc.id);
        }
        // fallback: if API returned nested new_customer in deal
        return d.new_customer?.id === nc.id;
      });
      return {
        new_customer: nc,
        deal_customer: deal || null,
      };
    });

    // Also include any deal entries that belong to new customers not present (defensive)
    deals.value.forEach((d) => {
      const has = combinedData.value.some(
        (item) => item.new_customer?.id === d.new_customer_id
      );
      if (!has) {
        combinedData.value.push({
          new_customer: d.new_customer || null,
          deal_customer: d,
        });
      }
    });

    // update totalItems for pagination
    totalItems.value = combinedData.value.length;
  } catch (e) {
    console.error("loadData error:", e);
    combinedData.value = [];
    newCustomers.value = [];
    deals.value = [];
    totalItems.value = 0;
  } finally {
    loading.value = false;
  }
};

const onSelectCustomer = () => {
  selectedCustomer.value = newCustomers.value.find(
    (c) => Number(c.id) === Number(dealForm.value.new_customer_id)
  );
};

const handleSave = async () => {
  // ensure new_customer_id exists
  if (!dealForm.value.new_customer_id) {
    alertType.value = "error";
    alertMessage.value = "Pilih customer terlebih dahulu.";
    showAlert.value = true;
    setTimeout(() => (showAlert.value = false), 3000);
    return;
  }

  const fd = new FormData();
  isLoading.value = true;

  // always include new_customer_id
  fd.append("new_customer_id", dealForm.value.new_customer_id);

  // append other fields (skip null payment_status)
  Object.keys(dealForm.value).forEach((key) => {
    const val = dealForm.value[key];
    if (key === "payment_status") {
      if (val) fd.append(key, val);
    } else if (val !== null && val !== undefined) {
      fd.append(key, String(val));
    }
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
    // reload data
    await loadData();
  } catch (error) {
    console.error("handleSave error:", error);
    // try to show backend validation if exists
    const msg =
      error?.response?.data?.message ||
      "Gagal menyimpan data! Silahkan cek input.";
    alertType.value = "error";
    alertMessage.value = msg;
    showAlert.value = true;
  } finally {
    isLoading.value = false;
    setTimeout(() => (showAlert.value = false), 3000);
    reset();
  }
};

const editDeal = (d) => {
  isEditing.value = true;

  dealForm.value = {
    id: d.deal_customer?.id ?? null,
    new_customer_id: d.new_customer?.id ?? "",
    handler: d.deal_customer?.handler ?? "",
    link_drive: d.deal_customer?.link_drive ?? "",
    total_pax: d.deal_customer?.total_pax ?? "",
    activity: d.deal_customer?.activity ?? "",
    payment_status: null,
  };

  editFormNewCustomer.value = {
    date: d.new_customer?.date ?? "",
    phone: d.new_customer?.phone ?? "",
    name: d.new_customer?.name ?? "",
    progress: d.new_customer?.progress ?? "",
    pic: d.new_customer?.pic ?? "",
    segmen: d.new_customer?.segmen ?? "",
    via: d.new_customer?.via ?? "",
    country: d.new_customer?.country ?? "",
    social_media_id: d.new_customer?.social_media_id ?? "",
    tour_packages: d.new_customer?.tour_packages ?? "",
    check_in: d.new_customer?.check_in ?? "",
    check_out: d.new_customer?.check_out ?? "",
    hotel: d.new_customer?.hotel ?? "",
    notes: d.new_customer?.notes ?? "",
  };

  window.scrollTo({ top: 0, behavior: "smooth" });
};

const confirmDelete = async () => {
  try {
    if (deleteType.value === "deal") {
      await api.delete(`/deal-customer/${selectedId.value}`);
    } else {
      await api.delete(`/new-customer/${selectedId.value}`);
    }
    await loadData();
    showDeleteModal.value = false;
  } catch (error) {
    console.error("confirmDelete error:", error);
    alert("Gagal menghapus data.");
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
  selectedCustomerText.value = "";
  isEditing.value = false;
  originalDealData.value = null;
};
onMounted(loadData);

// Filtered list based on search + filters
const filteredDeals = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase();
  const dateFilter = filterDate.value;
  const progressFilter = filterProgress.value;
  const segmenFilter = selectedSegmen.value;

  return combinedData.value.filter((item) => {
    const c = item.new_customer || {};
    const d = item.deal_customer || {};

    // search across several fields
    const fields = [
      c.name,
      c.phone,
      c.date,
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
      d.handler,
      d.link_drive,
      d.activity,
      String(d.total_pax || ""),
      d.payment_status,
    ]
      .map((f) =>
        f === null || f === undefined ? "" : String(f).toLowerCase()
      )
      .join(" ");

    const matchesKeyword = keyword ? fields.includes(keyword) : true;
    const matchesDate = dateFilter ? c.date === dateFilter : true;
    const matchesProgress =
      progressFilter && progressFilter !== "all"
        ? (c.progress || "").toLowerCase() === progressFilter.toLowerCase()
        : true;
    const matchesSegmen =
      segmenFilter && segmenFilter !== "all"
        ? (c.segmen || "").toLowerCase() === segmenFilter.toLowerCase()
        : true;

    return matchesKeyword && matchesDate && matchesProgress && matchesSegmen;
  });
});

// unique segmens from combinedData
const uniqueSegmens = computed(() => {
  const seg = new Set();
  combinedData.value.forEach((item) => {
    const s = item.new_customer?.segmen;
    if (s) seg.add(s);
  });
  return Array.from(seg);
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

  const rows = filteredDeals.value.map((item) => {
    const c = item.new_customer || {};
    const d = item.deal_customer || {};

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
      d.payment_status || "",
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
    selectedCustomer.value = null;
  } else {
    dealForm.value.new_customer_id = cust.id;
    selectedCustomerText.value = `${cust.name}`;
    onSelectCustomer();
  }

  showCustomerDropdown.value = false;
};

const cancelEdit = () => {
  if (originalDealData.value) {
    dealForm.value = {
      id: originalDealData.value.deal_customer?.id ?? null,
      new_customer_id: originalDealData.value.new_customer?.id ?? "",
      handler: originalDealData.value.deal_customer?.handler ?? "",
      link_drive: originalDealData.value.deal_customer?.link_drive ?? "",
      total_pax: originalDealData.value.deal_customer?.total_pax ?? "",
      activity: originalDealData.value.deal_customer?.activity ?? "",
      payment_status: null,
    };

    selectedCustomer.value = originalDealData.value.new_customer;
    selectedCustomerText.value = `${originalDealData.value.new_customer?.name} — (${originalDealData.value.new_customer?.phone})`;
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
  const list = filteredDeals.value;
  // update totalItems for pagination UI
  totalItems.value = list.length;
  return list.slice(start, start + pageSize.value);
});

watch([searchKeyword, filterDate, filterProgress, selectedSegmen], () => {
  currentPage.value = 1;
});

const openDeleteModal = (row) => {
  // row is combinedData item
  if (row.deal_customer?.id) {
    deleteType.value = "deal";
    selectedId.value = row.deal_customer.id;
  } else if (row.new_customer?.id) {
    deleteType.value = "customer";
    selectedId.value = row.new_customer.id;
  } else {
    console.error("❌ Tidak ada ID yang bisa dihapus");
    return;
  }
  showDeleteModal.value = true;
};

const filteredCustomers = computed(() => {
  if (!customerSearch.value) return newCustomers.value;
  const keyword = customerSearch.value.toLowerCase();
  return newCustomers.value.filter(
    (customer) =>
      customer.name.toLowerCase().includes(keyword) ||
      (customer.progress && customer.progress.toLowerCase().includes(keyword))
  );
});
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
    <div
      v-if="isEditing"
      class="bg-white rounded-xl shadow border border-slate-200 p-6 mb-8"
    >
      <h3 class="text-lg font-semibold mb-4 text-slate-700">
        Form Deal Customer
      </h3>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-5 text-[15px]">
        <div>
          <label>Date *</label>
          <input v-model="editFormNewCustomer.date" type="date" class="input" />
        </div>

        <div>
          <label>Phone *</label>
          <input v-model="editFormNewCustomer.phone" class="input" />
        </div>

        <div>
          <label>Customer Name *</label>
          <input v-model="editFormNewCustomer.name" class="input" />
        </div>

        <div>
          <label>Progress *</label>
          <input v-model="editFormNewCustomer.progress" class="input" />
        </div>

        <div>
          <label>PIC *</label>
          <input v-model="editFormNewCustomer.pic" class="input" />
        </div>

        <div>
          <label>Segmen *</label>
          <input v-model="editFormNewCustomer.segmen" class="input" />
        </div>

        <div>
          <label>Via *</label>
          <input v-model="editFormNewCustomer.via" class="input" />
        </div>

        <div>
          <label>Country *</label>
          <input v-model="editFormNewCustomer.country" class="input" />
        </div>

        <div>
          <label>Social Media *</label>
          <input v-model="editFormNewCustomer.social_media_id" class="input" />
        </div>

        <div>
          <label>Tour Packages *</label>
          <input v-model="editFormNewCustomer.tour_packages" class="input" />
        </div>

        <div>
          <label>Check In *</label>
          <input
            v-model="editFormNewCustomer.check_in"
            type="date"
            class="input"
          />
        </div>

        <div>
          <label>Check Out *</label>
          <input
            v-model="editFormNewCustomer.check_out"
            type="date"
            class="input"
          />
        </div>

        <div>
          <label>Hotel *</label>
          <input v-model="editFormNewCustomer.hotel" class="input" />
        </div>

        <div class="col-span-2">
          <label>Notes</label>
          <textarea
            v-model="editFormNewCustomer.notes"
            class="input"
          ></textarea>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-5 text-[15px]">
        <div>
          <label class="font-medium text-slate-700">
            Handler <span class="text-red-500">*</span>
          </label>
          <input
            v-model="dealForm.handler"
            class="w-full border-[1.5px] border-slate-200 rounded-lg p-3 mt-1 focus:border-slate-300 outline-none transition-all bg-white/80 backdrop-blur"
            placeholder="Handler"
          />
        </div>

        <div>
          <label class="font-medium text-slate-700">
            Link Drive <span class="text-red-500">*</span>
          </label>
          <input
            v-model="dealForm.link_drive"
            class="w-full border-[1.5px] border-slate-200 rounded-lg p-3 mt-1 focus:border-slate-300 outline-none transition-all bg-white/80 backdrop-blur"
            placeholder="Link Drive"
          />
        </div>

        <div>
          <label class="font-medium text-slate-700">
            Total Pax <span class="text-red-500">*</span>
          </label>
          <input
            v-model="dealForm.total_pax"
            type="number"
            class="w-full border-[1.5px] border-slate-200 rounded-lg p-3 mt-1 focus:border-slate-300 outline-none transition-all bg-white/80 backdrop-blur"
            placeholder="Total Pax"
          />
        </div>

        <div>
          <label class="font-medium text-slate-700">
            Activity <span class="text-red-500">*</span>
          </label>
          <input
            v-model="dealForm.activity"
            class="w-full border-[1.5px] border-slate-200 rounded-lg p-3 mt-1 focus:border-slate-300 outline-none transition-all bg-white/80 backdrop-blur"
            placeholder="Activity"
          />
        </div>

        <div class="col-span-2">
          <label class="font-medium text-slate-700">
            Payment Status (Upload)
            <span class="text-red-500">*</span>

            <span class="block text-xs text-slate-500 mt-1 mb-1">
              Allowed: jpg, jpeg, png, pdf
            </span>
          </label>

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
          <!-- Loading -->
          <tr v-if="loading">
            <td colspan="21" class="p-4">
              <div class="space-y-2">
                <div class="h-4 bg-gray-300 rounded w-3/4 animate-pulse"></div>
                <div class="h-4 bg-gray-300 rounded w-full animate-pulse"></div>
                <div class="h-4 bg-gray-300 rounded w-5/6 animate-pulse"></div>
              </div>
            </td>
          </tr>

          <!-- Tidak ada data -->
          <tr v-else-if="!loading && paginatedDataCustomers.length === 0">
            <td
              colspan="21"
              class="text-center p-4 text-gray-800 font-semibold"
            >
              Data not found
            </td>
          </tr>

          <!-- LIST DATA -->
          <tr
            v-else
            v-for="(d, i) in paginatedDataCustomers"
            :key="d.id"
            class="border-b border-slate-200 hover:bg-blue-50 transition-colors"
          >
            <td class="px-4 py-2">{{ i + 1 }}</td>

            <!-- NEW CUSTOMER -->
            <td class="px-4 py-3">{{ d.new_customer?.date }}</td>
            <td class="px-4 py-3">{{ d.new_customer?.phone }}</td>
            <td class="px-4 py-3">{{ d.new_customer?.name }}</td>

            <!-- Badge Progress -->
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

            <td class="px-4 py-3">{{ d.new_customer?.pic }}</td>
            <td class="px-4 py-3">{{ d.new_customer?.segmen }}</td>
            <td class="px-4 py-3">{{ d.new_customer?.via }}</td>
            <td class="px-4 py-3">{{ d.new_customer?.country }}</td>

            <td class="px-4 py-3">
              <a
                :href="d.new_customer?.social_media_id"
                target="_blank"
                class="text-blue-600 underline hover:text-blue-800"
              >
                {{ d.new_customer?.social_media_id }}
              </a>
            </td>

            <td class="px-4 py-3">{{ d.new_customer?.tour_packages }}</td>
            <td class="px-4 py-3">{{ d.new_customer?.check_in }}</td>
            <td class="px-4 py-3">{{ d.new_customer?.check_out }}</td>
            <td class="px-4 py-3">{{ d.new_customer?.hotel }}</td>

            <td>{{ d.deal_customer?.handler ?? "-" }}</td>
            <td>{{ d.deal_customer?.link_drive ?? "-" }}</td>
            <td>{{ d.deal_customer?.total_pax ?? "-" }}</td>
            <td>{{ d.deal_customer?.activity ?? "-" }}</td>

            <td>
              <a
                v-if="d.deal_customer?.payment_status"
                :href="`https://api.officebst.com/storage/${d.deal_customer.payment_status}`"
                target="_blank"
              >
                Lihat File
              </a>
              <span v-else>-</span>
            </td>

            <td class="px-4 py-3">{{ d.new_customer?.notes }}</td>

            <!-- ACTION BUTTONS -->
            <td class="px-4 py-3 whitespace-nowrap">
              <div class="flex items-center gap-2">
                <button
                  @click="editDeal(d)"
                  class="bg-white border border-slate-200 hover:bg-slate-100 px-2 py-2 rounded-md shadow flex items-center justify-center"
                >
                  <Pencil class="w-4 h-4 text-orange-500" />
                </button>

                <button
                  @click="openDeleteModal(d)"
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
