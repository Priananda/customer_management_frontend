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
  Download,
  X,
} from "lucide-vue-next";
import FilePreviewModal from "../components/FilePreviewModal.vue";
import ConfirmModal from "../components/ConfirmModalDelete.vue";
import TablePagination from "../components/TablePagination.vue";
import note from "@/assets/images/note.png";

import {
  ref,
  computed,
  onMounted,
  onBeforeUnmount,
  watch,
  watchEffect,
  nextTick,
} from "vue";
import api from "../api/api";
import { useAuthStore } from "../stores/auth.js";

const authStore = useAuthStore();
const picName = computed(() => authStore.user?.name || "");

watchEffect(() => {
  console.log("authStore.user =", authStore.user);
  console.log("PIC name =", picName.value);
});

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
const showCountryDropdown = ref(false);
const newCustomers = ref([]);
const summary = ref({
  total: 0,
  onProgress: 0,
  deal: 0,
  canceled: 0,
  waiting: 0,
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
const showPreviewModal = ref(false);
const loadingModal = ref(false);
const showModal = ref(false);
const editId = ref(null);
const form = ref({
  date: "",
  phone: "",
  email: "",
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
const isDeleting = ref(false);
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
      email: c.email ?? "",
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

// TERMASUK FITUR UPLOAD
const progressError = ref("");
const submitForm = async () => {
  if (loadingModal.value) return;
  loadingModal.value = true;
  progressError.value = "";

  if (!form.value.progress) {
    progressError.value = "Harap isikan progress terlebih dahulu";
    loadingModal.value = false;
    return;
  }

  try {
    const formData = new FormData();

    // Append semua field form
    Object.keys(form.value).forEach((key) => {
      if (key === "hotel") {
        formData.append(key, form.value[key].join(",")); // simpan hotel sebagai string
      } else {
        formData.append(key, form.value[key] ?? "");
      }
    });

    // Append semua file baru
    selectedFiles.value.forEach((file) => formData.append("files[]", file));

    let res;
    if (editId.value) {
      formData.append("_method", "PUT");
      res = await api.post(
        `/new-customer/${editId.value}/update-with-files`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      // Update preview file
      existingFiles.value.push(...(res.data.files || []));
    } else {
      // Create customer baru + upload file
      res = await api.post("/new-customer-with-files", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      existingFiles.value = res.data.files || [];
    }

    resetForm();
    selectedFiles.value = [];
    await getNewCustomers();
    await getSummary();
    closeModal();
  } catch (err) {
    console.error("Error submitting form:", err);
  } finally {
    loadingModal.value = false;
  }
};

const confirmDelete = async () => {
  try {
    isDeleting.value = true;
    await api.delete(`/new-customer/${selectedId.value}`);
    await getNewCustomers();
    await getSummary();

    showDeleteModal.value = false;
    selectedId.value = null;
  } catch (error) {
    console.error(error);
    alert("Gagal menghapus data");
  } finally {
    isDeleting.value = false;
  }
};

// Data perbulan
const month = ref("");
const year = ref("");
const filterMonth = ref("");
const isFiltering = ref(false);
const filteredCustomers = computed(() => {
  const keyword = (searchKeyword.value || "").toLowerCase();

  return newCustomers.value.filter((c) => {
    const matchesKeyword =
      (c.date || "").toLowerCase().includes(keyword) ||
      (c.phone || "").toLowerCase().includes(keyword) ||
      (c.email || "").toLowerCase().includes(keyword) ||
      (c.name || "").toLowerCase().includes(keyword) ||
      (c.progress || "").toLowerCase().includes(keyword) ||
      (c.pic || "").toLowerCase().includes(keyword) ||
      (c.segmen || "").toLowerCase().includes(keyword) ||
      (c.via || "").toLowerCase().includes(keyword) ||
      (c.country || "").toLowerCase().includes(keyword) ||
      (c.social_media_id || "").toLowerCase().includes(keyword) ||
      (c.tour_packages || "").toLowerCase().includes(keyword) ||
      formatDate(c.check_in).includes(keyword) ||
      formatDate(c.check_out).includes(keyword) ||
      (c.hotel || "").toLowerCase().includes(keyword) ||
      (c.notes || "").toLowerCase().includes(keyword);

    const matchesDate = filterDate.value
      ? (() => {
          const filter = filterDate.value;
          const checkIn = formatDate(c.check_in);
          const checkOut = formatDate(c.check_out);

          if (checkIn && checkOut) {
            return filter >= checkIn && filter <= checkOut;
          }
          return [
            formatDate(c.date),
            formatDate(c.check_in),
            formatDate(c.check_out),
          ].includes(filter);
        })()
      : true;

    // Data perbulan
    const matchesMonth = filterMonth.value
      ? (() => {
          const filter = filterMonth.value;
          const checkInMonth = getMonth(c.check_in);
          const checkOutMonth = getMonth(c.check_out);
          const dateMonth = getMonth(c.date);

          if (checkInMonth && checkOutMonth) {
            return filter >= checkInMonth && filter <= checkOutMonth;
          }

          return [dateMonth, checkInMonth, checkOutMonth].includes(filter);
        })()
      : true;

    const matchesProgress =
      filterProgress.value && filterProgress.value !== "all"
        ? c.progress === filterProgress.value
        : true;

    const matchesSegmen =
      selectedSegmen.value && selectedSegmen.value !== "all"
        ? (c.segmen || "").toLowerCase() === selectedSegmen.value.toLowerCase()
        : true;

    return (
      matchesKeyword &&
      matchesMonth &&
      matchesDate &&
      matchesProgress &&
      matchesSegmen
    );
  });
});

// Data perbulan
watch(
  [searchKeyword, filterMonth, filterDate, filterProgress, selectedSegmen],
  async () => {}
);

// Data perbulan
watch([month, year], ([m, y]) => {
  if (m && y) {
    filterMonth.value = `${y}-${m}`;
    // Kombinasi bulan + tahun → trigger loading sekali
    isFiltering.value = true;
    nextTick(() => {
      setTimeout(() => {
        isFiltering.value = false;
      }, 700);
    });
  } else if (y && !m) {
    // Hanya tahun dipilih → trigger loading
    filterMonth.value = "";
    isFiltering.value = true;
    nextTick(() => {
      setTimeout(() => {
        isFiltering.value = false;
      }, 700);
    });
  } else {
    // Hanya bulan dipilih → tidak ada loading
    filterMonth.value = "";
  }
});
watch([filterDate], ([d]) => {
  if (d) {
    isFiltering.value = true;
    nextTick(() => {
      setTimeout(() => {
        isFiltering.value = false;
      }, 700);
    });
  }
});

// Data perbulan
const getMonth = (date) => {
  if (!date) return null;
  return date.slice(0, 7);
};

const formatDate = (date) => {
  if (!date) return "";
  if (typeof date === "string") return date;
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
  if (p === "waiting")
    return "bg-yellow-100 text-yellow-800 border border-yellow-200";
  if (p === "canceled") return "bg-red-100 text-red-800 border border-red-200";
  return "bg-slate-100 text-slate-700 border border-slate-200";
};

const openCreateModal = () => {
  resetForm();
  editId.value = null;

  form.value.pic = authStore.user?.name;

  showModal.value = true;
};

const openEditModal = (customer) => {
  editId.value = customer.id;

  Object.keys(form.value).forEach((k) => {
    form.value[k] = customer[k] ?? "";
  });

  form.value.hotel = customer.hotel
    ? customer.hotel.split(",").map((h) => h.trim())
    : [""];

  fetchCustomerFiles(customer.id);
  showModal.value = true;
};
const fetchCustomerFiles = async (customerId) => {
  try {
    const res = await api.get(`/customer-files/${customerId}`);
    existingFiles.value = res.data.files;
  } catch (err) {
    console.error("Error fetching customer files:", err);
    existingFiles.value = [];
  }
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
  selectedFiles.value = [];
  existingFiles.value = [];
};

const closeModal = () => {
  showModal.value = false;
  showPreviewModal.value = false;
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

// const progressOptions = ["on progress", "deal", "canceled", "waiting"];
const progressOptions = [
  {
    label: "on progress",
    value: "on progress",
    color: "bg-blue-100 text-blue-800 border border-blue-200",
  },
  {
    label: "deal",
    value: "deal",
    color: "bg-green-100 text-green-800 border border-green-200",
  },
  {
    label: "waiting",
    value: "waiting",
    color: "bg-yellow-100 text-yellow-800 border border-yellow-200",
  },
  {
    label: "canceled",
    value: "canceled",
    color: "bg-red-100 text-red-800 border border-red-200",
  },
];

// Data perbulan
const isRotating = ref(false);
function resetFilters() {
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
    selectedHotels.value = hotelStr.split(",");
  } else {
    selectedHotels.value = [hotelStr];
  }
  showHotelModal.value = true;
};
const closeHotelModal = () => {
  showHotelModal.value = false;
};

const showCountryModal = ref(false);
const newCountryInput = ref("");
const newCountryCategory = ref("");
const showCategoryDropdown = ref(false);

const countryCategories = ref({
  Asia: ["India", "China", "Japan", "Korea Selatan"],
  ASEAN: [
    "Indonesia",
    "Malaysia",
    "Singapore",
    "Thailand",
    "Vietnam",
    "Philippines",
  ],
  Eropa: ["Germany", "France", "Italy", "Spain", "United Kingdom"],
  Amerika: ["USA", "Canada", "Brazil", "Argentina"],
  Australia: ["Australia", "New Zealand"],
});

// pilih country dari list
const selectCountry = (country) => {
  form.value.country = country;
  showCountryModal.value = false;
};
// hapus country dari list
const deleteCountry = (category, country) => {
  countryCategories.value[category] = countryCategories.value[category].filter(
    (c) => c !== country
  );

  if (form.value.country === country) {
    form.value.country = "";
  }
};
const closeCountryModal = () => {
  showCountryModal.value = false;
};
const selectCategory = (category) => {
  newCountryCategory.value = category;
  showCategoryDropdown.value = false;
};

// Alert reactive
const alertMessage = ref("");
const alertColor = ref("red");
const showAlert = (message, color = "red") => {
  alertMessage.value = message;
  alertColor.value = color;
  setTimeout(() => {
    alertMessage.value = "";
  }, 5000);
};

// Alert Tailwind
const addNewCountryToCategory = () => {
  const country = newCountryInput.value.trim();
  const category = newCountryCategory.value;

  if (!country && !category) {
    showAlert("Isi nama negara & pilih kategori!", "red");
    return;
  }

  if (!country) {
    showAlert("Nama negara wajib diisi!", "red");
    return;
  }

  if (!category) {
    showAlert("Pilih kategori negara!", "red");
    return;
  }

  if (!countryCategories.value[category].includes(country)) {
    countryCategories.value[category].push(country);
  }

  form.value.country = country;
  newCountryInput.value = "";
  newCountryCategory.value = "";
  showCountryModal.value = false;
};

// FITUR FITUR UPLOAD
const selectedFiles = ref([]);
const existingFiles = ref([]);

// Tambahkan file baru tanpa menimpa yang lama
const handleFileChange = (e) => {
  const newFiles = Array.from(e.target.files);
  selectedFiles.value = [...selectedFiles.value, ...newFiles];
};

// Hapus file baru sebelum upload
const removeSelectedFile = (index) => {
  selectedFiles.value.splice(index, 1);
};

// Hapus file lama (sudah di backend)
const removeExistingFile = async (fileId) => {
  try {
    await api.delete(`/customer-files/${fileId}`);
    existingFiles.value = existingFiles.value.filter((f) => f.id !== fileId);
  } catch (err) {
    console.error("Error deleting file:", err);
  }
};
// BUKA MODAL PREVIEW LOCAL KE DOMAIN
const openFilePreview = async (customerId) => {
  existingFiles.value = [];

  if (!customerId) {
    showPreviewModal.value = true;
    return;
  }
  try {
    const response = await api.get(`/customer-files/${customerId}`);
    existingFiles.value = Array.isArray(response.data.files)
      ? response.data.files.map((f) => ({
          id: f.id,
          original_name: f.original_name,
          preview_url: f.preview_url.startsWith("http")
            ? f.preview_url
            : `http://127.0.0.1:8000${f.preview_url}`,
        }))
      : [];
  } catch (err) {
    console.error("Error get files:", err);
    existingFiles.value = [];
  } finally {
    showPreviewModal.value = true;
  }
};

// DOWLOAD PDF
const isBouncing = ref(false);
const downloadPdfAll = () => {
  isBouncing.value = true;

  setTimeout(() => {
    window.open("http://127.0.0.1:8000/customers/pdf-all", "_blank");
    setTimeout(() => {
      isBouncing.value = false;
    }, 600);
  }, 200);
};

const instagramUrl = (val) => {
  if (!val) return "#";

  if (val.startsWith("http")) return val;

  return `https://www.instagram.com/${val.replace("@", "")}`;
};

// Data perbulan
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
</script>

<template>
  <div class="container p-4 max-w-sm md:max-w-3xl lg:max-w-6xl mx-auto">
    <div class="flex items-start gap-3 mb-6">
      <img
        :src="note"
        alt="New Customer"
        class="w-18 h-18 object-contain shrink-0"
      />
      <div>
        <h2 class="text-xl font-bold text-black tracking-tight">
          New Customer
        </h2>
        <p class="text-md text-slate-600">
          See all deal, new customer, new chat, and summary report
        </p>
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
        <!-- BULAN -->
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

        <!-- TAHUN  -->
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

      <!-- MODAL BULAN -->
      <div
        v-if="showMonthModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
        @click.self="showMonthModal = false"
      >
        <div
          class="relative bg-white w-80 border border-slate-300 rounded-lg shadow-lg overflow-hidden"
        >
          <!-- X pojok kanan -->
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

      <!-- MODAL TAHUN -->
      <div
        v-if="showYearModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
        @click.self="showYearModal = false"
      >
        <div
          class="relative bg-white w-80 border border-slate-300 rounded-lg shadow-lg overflow-hidden"
        >
          <!-- X pojok kanan -->
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

      <!-- Progress dropdown -->
      <div class="relative" id="progress-dropdown">
        <button
          @click.stop="openOnlyProgress()"
          class="w-full hover:shadow-md transition border border-slate-300 rounded-lg px-3 py-2 flex items-center justify-between"
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
            class="absolute z-20 mt-1 min-w-full bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden"
          >
            <!-- ALL -->
            <div
              class="px-3 py-2 cursor-pointer hover:bg-slate-50 flex justify-start"
              @click="selectProgress('all')"
            >
              <span
                class="inline-flex w-[130px] justify-center px-2 py-1 text-xs rounded-full font-medium border bg-slate-100 text-slate-700 border-slate-200"
              >
                All Progress
              </span>
            </div>

            <!-- PROGRESS LIST -->
            <div
              v-for="prog in ['on progress', 'deal', 'waiting', 'canceled']"
              :key="prog"
              class="px-3 py-2 cursor-pointer hover:bg-slate-50 flex justify-start"
              @click="selectProgress(prog)"
            >
              <span
                class="inline-flex w-[130px] justify-center px-2 py-1 text-xs rounded-full font-medium border capitalize"
                :class="[
                  prog === 'on progress' &&
                    'bg-blue-100 text-blue-800 border-blue-200',
                  prog === 'deal' &&
                    'bg-green-100 text-green-800 border-green-200',
                  prog === 'waiting' &&
                    'bg-yellow-100 text-yellow-800 border-yellow-200',
                  prog === 'canceled' &&
                    'bg-red-100 text-red-800 border-red-200',
                ]"
              >
                {{ prog }}
              </span>
            </div>
          </div>
        </transition>
      </div>

      <!-- Segmen dropdown -->
      <div class="relative" id="segmen-dropdown">
        <button
          @click.stop="openOnlySegmen()"
          class="w-full hover:shadow-md transition border border-slate-300 rounded-lg px-3 py-2 flex items-center justify-between"
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
            class="absolute z-20 mt-1 w-full hover:shadow-md transition bg-white border border-slate-200 rounded-lg shadow-lg overflow-y-auto hidden-scroll max-h-[200px]"
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
          class="cursor-pointer w-full bg-slate-800 hover:bg-slate-700 text-white font-medium py-2 rounded-lg"
        >
          Add New Customer
        </button>
      </div>

      <div class="lg:col-span-5 flex gap-3 justify-end mb-4">
        <!-- DOWNLOAD PDF -->
        <button
          @click="downloadPdfAll"
          class="cursor-pointer inline-flex items-center gap-2 bg-linear-to-br from-indigo-700 to-blue-700 hover:from-indigo-600 hover:to-blue-600 text-white font-semibold px-5 py-2.5 rounded-lg shadow-md hover:shadow-lg transition"
        >
          <Download
            class="w-4 h-4 transition-transform"
            :class="{ 'bounce-animation': isBouncing }"
          />
          Download PDF
        </button>

        <!-- RESET -->
        <button
          @click="resetFilters"
          class="cursor-pointer inline-flex items-center gap-2 bg-linear-to-br from-indigo-700 to-blue-700 hover:from-indigo-600 hover:to-blue-600 text-white font-semibold px-5 py-2.5 rounded-lg shadow-md hover:shadow-lg transition"
        >
          <RotateCcw
            class="w-4 h-4 transition-transform"
            :class="{ 'rotate-animation': isRotating }"
          />
          Reset
        </button>
      </div>
    </div>

    <!-- TABLE -->
    <div
      class="overflow-x-auto rounded-lg border border-slate-200 hidden-scroll"
    >
      <table class="min-w-full bg-white rounded-lg text-sm table-fixed">
        <thead class="bg-linear-to-br from-indigo-700 to-blue-700 text-white">
          <tr>
            <th
              class="px-4 py-3 text-left w-[10%] whitespace-nowrap overflow-hidden text-ellipsis"
            >
              Actions
            </th>
            <th
              class="px-4 py-3 text-left whitespace-nowrap overflow-hidden text-ellipsis"
            >
              No
            </th>
            <th
              class="px-4 py-3 text-left w-[12%] whitespace-nowrap overflow-hidden text-ellipsis"
            >
              File
            </th>
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
              class="px-4 py-3 text-left w-[12%] whitespace-nowrap overflow-hidden text-ellipsis"
            >
              Notes
            </th>
            <th
              class="px-4 py-3 text-left w-[10%] whitespace-nowrap overflow-hidden text-ellipsis"
            >
              Actions
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
            <td class="px-4 py-3 align-middle text-left whitespace-nowrap">
              <div class="flex items-center gap-2">
                <!-- Button Edit -->
                <button
                  v-if="canEdit"
                  @click="openEditModal(c)"
                  class="px-2 py-2 flex items-center justify-center"
                >
                  <Pencil class="w-4 h-4 text-orange-500" />
                </button>

                <!-- Button Delete -->
                <button
                  v-if="canEdit"
                  @click="openDeleteModal(c.id)"
                  class="px-2 py-2 flex items-center justify-center"
                >
                  <Trash2 class="w-4 h-4 text-red-600" />
                </button>
              </div>
            </td>
            <!-- <td class="px-4 py-2 whitespace-nowrap">{{ i + 1 }}</td> -->
            <td class="px-4 py-2 whitespace-nowrap">
              {{ (currentPage - 1) * pageSize + i + 1 }}
            </td>

            <td>
              <button
                @click="openFilePreview(c.id)"
                class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 hover:text-blue-800 transition"
              >
                View
              </button>
            </td>
            <td class="px-4 py-3 align-middle text-left whitespace-nowrap">
              {{ c.date || "-" }}
            </td>
            <td class="px-4 py-3 align-middle text-left whitespace-nowrap">
              {{ c.phone || "-" }}
            </td>
            <td class="px-4 py-3 align-middle text-left whitespace-nowrap">
              {{ c.email || "-" }}
            </td>
            <td class="px-4 py-3 align-middle text-left whitespace-nowrap">
              {{ c.name || "-" }}
            </td>
            <td class="px-4 py-3 align-middle text-left whitespace-nowrap">
              {{ c.check_in || "-" }}
            </td>
            <td class="px-4 py-3 align-middle text-left whitespace-nowrap">
              {{ c.check_out || "-" }}
            </td>
            <td class="px-4 py-3 align-middle text-left">
              {{ c.tour_packages || "-" }}
            </td>
            <td class="px-4 py-3 align-middle text-left whitespace-nowrap">
              {{ c.country || "-" }}
            </td>
            <td class="px-4 py-3 align-middle text-left whitespace-nowrap">
              <span
                :class="[
                  'inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-semibold w-28',
                  progressColor(c.progress),
                ]"
                >{{ c.progress || "-" }}</span
              >
            </td>
            <td class="px-4 py-3 align-middle text-left whitespace-nowrap">
              {{ c.pic || "-" }}
            </td>
            <td class="px-4 py-3 align-middle text-left whitespace-nowrap">
              {{ c.segmen || "-" }}
            </td>
            <td class="px-4 py-3 align-middle text-left whitespace-nowrap">
              {{ c.via || "-" }}
            </td>
            <td class="px-4 py-3 align-middle text-left whitespace-nowrap">
              <a
                v-if="c.social_media_id"
                :href="instagramUrl(c.social_media_id)"
                target="_blank"
                rel="noopener"
                class="inline-flex items-center gap-1 text-blue-600 underline hover:text-blue-800"
              >
                {{ c.social_media_id || "-" }}
              </a>

              <span v-else>-</span>
            </td>

            <td class="px-4 py-3 text-left whitespace-nowrap">
              <button
                @click="openHotelModal(c.hotel)"
                class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 hover:text-blue-800 transition"
              >
                View
              </button>
            </td>

            <!-- Modal -->
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
                class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                @click.self="closeHotelModal"
              >
                <!-- Modal Card -->
                <div
                  class="bg-white w-full max-w-xl rounded-xl shadow-md overflow-hidden"
                >
                  <!-- Header -->
                  <div class="px-6 py-4 flex items-center justify-between">
                    <h3
                      class="flex items-center gap-2 mb-3 text-lg font-semibold text-slate-800"
                    >
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

            <td class="px-4 py-3 align-middle text-left whitespace-nowrap">
              {{ c.notes || "-" }}
            </td>
            <td class="px-4 py-3 align-middle text-left whitespace-nowrap">
              <div class="flex items-center gap-2">
                <!-- Button Edit -->
                <button
                  v-if="canEdit"
                  @click="openEditModal(c)"
                  class="px-2 py-2 flex items-center justify-center"
                >
                  <Pencil class="w-4 h-4 text-orange-500" />
                </button>

                <!-- Button Delete -->
                <button
                  v-if="canEdit"
                  @click="openDeleteModal(c.id)"
                  class="px-2 py-2 flex items-center justify-center"
                >
                  <Trash2 class="w-4 h-4 text-red-600" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <FilePreviewModal
      :show="showPreviewModal"
      :files="existingFiles"
      @close="showPreviewModal = false"
    />

    <!-- Modal delete -->
    <ConfirmModal
      :show="showDeleteModal"
      title="Delete Data"
      message="Apakah Anda yakin ingin menghapus data ini?"
      cancelText="Tidak"
      confirmText="Ya"
      :loading="isDeleting"
      @cancel="!isDeleting && (showDeleteModal = false)"
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
          <div class="mt-4 px-7">
            <p
              v-if="progressError"
              class="inline-block bg-red-100 text-red-700 border border-red-300 text-sm px-4 py-1 rounded-full transition-all duration-300 ease-out opacity-100 translate-y-0"
            >
              {{ progressError }}
            </p>
          </div>

          <div
            class="sticky top-0 bg-white px-6 py-4 flex items-center justify-between z-10"
          >
            <h3 class="text-lg font-semibold flex items-center">
              <img :src="note" alt="note icon" class="w-10 h-10 mr-2" />
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
                    Email
                  </label>

                  <input
                    v-model="form.email"
                    placeholder="Email Guest Name"
                    class="p-3 rounded-lg border border-slate-300 ring-1 ring-blue-50 focus:outline-none"
                  />
                </div>
                <div class="flex flex-col mb-3">
                  <label
                    class="flex items-center gap-1 mb-1 font-medium text-slate-700"
                  >
                    Guest Name
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
                        :key="option.value"
                        @click="selectModalProgress(option.value)"
                        class="px-4 py-2 cursor-pointer flex items-center gap-2 hover:bg-blue-50"
                      >
                        <!-- Badge -->
                        <span
                          :class="[
                            'w-[130px] px-2 py-1 text-xs text-center rounded-full font-medium border',
                            option.color,
                          ]"
                        >
                          {{ option.label }}
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>

                <!-- PIC -->
                <div class="flex flex-col mb-3">
                  <label
                    class="flex items-center gap-1 mb-1 font-medium text-slate-700"
                  >
                    PIC
                  </label>
                  <input
                    :value="picName"
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
                    Segmen
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
                    Via
                  </label>
                  <input
                    v-model="form.via"
                    placeholder="Via"
                    class="p-3 rounded-lg border border-slate-300 ring-1 ring-blue-50 focus:outline-none"
                  />
                </div>

                <div class="flex flex-col mb-3">
                  <label
                    class="flex items-center gap-1 mb-1 font-medium text-slate-700"
                  >
                    Country
                  </label>

                  <div class="relative">
                    <div
                      @click="showCountryModal = true"
                      class="p-3 bg-white rounded-lg border border-slate-300 cursor-pointer select-none flex items-center justify-between"
                    >
                      <span class="text-slate-700">{{
                        form.country || "Select country"
                      }}</span>
                      <ChevronRight
                        class="w-4 h-4 text-slate-500 transform transition-transform duration-200"
                        :class="showCountryModal ? 'rotate-90' : 'rotate-0'"
                      />
                    </div>
                  </div>
                </div>

                <!-- Modal -->

                <transition name="modal-zoom" appear>
                  <div
                    v-if="showCountryModal"
                    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                  >
                    <div
                      class="bg-white rounded-xl max-w-xl w-full relative shadow-2xl overflow-hidden transform transition-all"
                    >
                      <!-- Alert -->
                      <div
                        v-if="alertMessage"
                        class="absolute top-16 left-1/2 -translate-x-1/2 px-5 py-2 rounded-lg shadow-md text-white text-center font-semibold text-sm z-50 transition-all"
                        :class="{
                          'bg-red-600': alertColor === 'red',
                          'bg-green-600': alertColor === 'green',
                          'bg-yellow-600': alertColor === 'yellow',
                        }"
                      >
                        {{ alertMessage }}
                      </div>

                      <!-- HEADER -->
                      <div class="px-6 py-5 flex justify-between items-center">
                        <h3 class="text-lg font-semibold text-slate-800">
                          Select Country
                        </h3>
                        <button
                          @click="closeCountryModal"
                          class="absolute top-4 right-4 text-gray-700 hover:text-gray-800 text-xl transition"
                        >
                          ✕
                        </button>
                      </div>

                      <!-- Input + Select + Add -->
                      <div
                        class="mt-5 px-6 py-5 flex flex-col sm:flex-row gap-3 items-center"
                      >
                        <input
                          v-model="newCountryInput"
                          type="text"
                          placeholder="Add new country"
                          class="flex-1 p-3 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring focus:ring-blue-200 outline-none transition"
                        />

                        <!-- Custom select kategori -->
                        <div class="relative w-full sm:w-40">
                          <div
                            @click="
                              showCategoryDropdown = !showCategoryDropdown
                            "
                            class="p-3 bg-white rounded-lg border border-slate-200 cursor-pointer flex justify-between items-center transition"
                          >
                            <span class="text-slate-700">{{
                              newCountryCategory || "Select category"
                            }}</span>
                            <svg
                              class="w-4 h-4 text-slate-500 transform transition-transform duration-200"
                              :class="
                                showCategoryDropdown ? 'rotate-180' : 'rotate-0'
                              "
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M19 9l-7 7-7-7"
                              ></path>
                            </svg>
                          </div>
                          <ul
                            v-if="showCategoryDropdown"
                            class="absolute left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-40 overflow-y-auto z-50 hidden-scroll"
                          >
                            <li
                              v-for="(v, key) in countryCategories"
                              :key="key"
                              @click="selectCategory(key)"
                              class="px-4 py-2 hover:bg-blue-50 cursor-pointer text-slate-700 text-sm"
                            >
                              {{ key }}
                            </li>
                          </ul>
                        </div>

                        <!-- Tombol Add -->
                        <button
                          @click="addNewCountryToCategory"
                          class="px-6 py-3 bg-linear-to-br from-indigo-700 to-blue-700 hover:from-indigo-600 hover:to-blue-600 text-white rounded-lg shadow-md transition w-full sm:w-auto font-semibold"
                        >
                          Add
                        </button>
                      </div>

                      <!-- List kategori + country -->
                      <div
                        class="px-6 max-h-80 overflow-y-auto space-y-4 hidden-scroll"
                      >
                        <template
                          v-for="(countries, category) in countryCategories"
                          :key="category"
                        >
                          <div class="bg-white rounded-xl shadow-sm p-4 mb-3">
                            <div
                              class="font-semibold text-slate-700 mb-3 text-md border-b border-gray-100 pb-2"
                            >
                              {{ category }}
                            </div>
                            <div
                              class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3"
                            >
                              <div
                                v-for="country in countries"
                                :key="country"
                                class="flex items-center justify-between px-4 py-2 rounded-full bg-linear-to-r from-indigo-100 to-blue-100 text-blue-900 font-semibold shadow-md hover:shadow-lg hover:scale-105 transform transition-all cursor-pointer"
                              >
                                <span
                                  @click="selectCountry(country)"
                                  class="truncate"
                                >
                                  {{ country }}
                                </span>
                                <button
                                  @click="deleteCountry(category, country)"
                                  class="ml-3 text-red-600 hover:text-red-700 text-sm font-bold transition-colors"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          </div>
                        </template>
                      </div>
                    </div>
                  </div>
                </transition>

                <!-- Social Media -->
                <div class="flex flex-col mb-3">
                  <label
                    class="flex items-center gap-1 mb-1 font-medium text-slate-700"
                  >
                    Social Media
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
                    Tour Packages
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
                    Check In
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
                    Check Out
                  </label>
                  <input
                    v-model="form.check_out"
                    type="date"
                    class="p-3 rounded-lg border border-slate-300 ring-1 ring-blue-50 focus:outline-none"
                  />
                </div>

                <!-- Hotel -->
                <!-- HOTEL -->
                <div class="mb-5">
                  <label
                    class="flex items-center gap-2 mb-3 text-sm font-semibold text-slate-800"
                  >
                    Hotel
                  </label>

                  <!-- HOTEL LIST -->
                  <div
                    v-for="(h, index) in form.hotel"
                    :key="index"
                    class="group flex items-center gap-3 mb-3"
                  >
                    <!-- INPUT -->
                    <div class="flex-1 relative">
                      <input
                        v-model="form.hotel[index]"
                        placeholder="Enter name hotel"
                        class="w-full p-3 rounded-lg border border-slate-300 ring-1 ring-blue-50 focus:outline-none"
                      />
                    </div>

                    <!-- REMOVE -->
                    <button
                      v-if="form.hotel.length > 1"
                      type="button"
                      @click="removeHotel(index)"
                      class="w-10 h-10 flex items-center justify-center text-red-600 hover:text-red-700 transition"
                      title="Hapus hotel"
                    >
                      ✕
                    </button>
                  </div>

                  <!-- ADD BUTTON -->
                  <button
                    type="button"
                    @click="addHotel"
                    class="cursor-pointer inline-flex items-center gap-1 mt-1 px-4 py-2.5 rounded-lg bg-linear-to-br bg-slate-800 text-white text-sm font-semibold shadow-md hover:shadow-lg transition"
                  >
                    <span class="text-lg leading-none">＋</span>
                    Add Hotel
                  </button>
                </div>

                <!-- Notes -->
                <div class="flex flex-col mb-3 col-span-2">
                  <label
                    class="flex items-center gap-1 mb-1 font-medium text-slate-700"
                  >
                    Notes
                  </label>
                  <textarea
                    v-model="form.notes"
                    class="min-h-[100px] p-3 rounded-lg border border-slate-300 ring-1 ring-blue-50 focus:outline-none"
                    placeholder="Notes"
                  ></textarea>
                </div>

                <!-- Upload Files -->
                <div class="flex flex-col mb-3 col-span-2">
                  <label
                    class="flex items-center gap-1 mb-1 font-medium text-slate-700"
                    >Upload Files</label
                  >
                  <input
                    type="file"
                    multiple
                    @change="handleFileChange"
                    class="p-2 border border-slate-300 rounded"
                  />
                </div>
                <!-- Files Preview Container -->
                <div
                  v-if="existingFiles.length || selectedFiles.length"
                  class="border border-slate-200 rounded-lg p-3 max-h-64 overflow-y-auto space-y-3"
                >
                  <!-- Existing files (backend) -->
                  <div v-if="existingFiles.length">
                    <p class="text-xs font-medium text-slate-500 mb-2">
                      Existing Files
                    </p>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div
                        v-for="file in existingFiles"
                        :key="file.id"
                        class="flex items-center justify-between gap-2 p-2 border border-slate-300 rounded-md bg-slate-100"
                      >
                        <div
                          :href="file.preview_url"
                          target="_blank"
                          class="text-xs truncate flex-1 text-slate-700"
                        >
                          {{ file.original_name }}
                        </div>

                        <button
                          type="button"
                          @click="removeExistingFile(file.id)"
                          class="text-red-500 text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- Selected files -->
                  <div v-if="selectedFiles.length">
                    <p class="text-xs font-medium text-slate-500 mb-2">
                      Selected Files
                    </p>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div
                        v-for="(file, index) in selectedFiles"
                        :key="index"
                        class="flex items-center justify-between gap-2 p-2 border border-slate-300 rounded-md bg-slate-50"
                      >
                        <span class="text-xs truncate flex-1 text-slate-700">
                          {{ file.name }}
                        </span>

                        <button
                          type="button"
                          @click="removeSelectedFile(index)"
                          class="text-red-500 text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </template>

              <!-- Footer -->
              <div class="col-span-2 flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  class="cursor-pointer px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg"
                  @click="closeModal"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  class="cursor-pointer rounded-lg bg-linear-to-br from-indigo-700 to-blue-700 hover:from-indigo-600 hover:to-blue-600 text-white font-medium px-4 py-2 flex items-center gap-2"
                  :disabled="loadingModal"
                >
                  <span v-if="loadingModal" class="animate-pulse"
                    >Memproses...</span
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

.modal-zoom-enter-active,
.modal-zoom-leave-active {
  transition: transform 0.25s ease, opacity 0.25s ease;
}
.modal-zoom-enter-from,
.modal-zoom-leave-to {
  transform: scale(0.8);
  opacity: 0;
}
.modal-zoom-enter-to,
.modal-zoom-leave-from {
  transform: scale(1);
  opacity: 1;
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

@keyframes bounceClick {
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

.bounce-animation {
  animation: bounceClick 0.6s ease-in-out;
}

.rotate-animation {
  animation: rotateClick 0.6s ease-in-out;
}
</style>
