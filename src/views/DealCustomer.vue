<script setup>
import {
  Search,
  Calendar,
  Filter,
  ChevronDown,
  Pencil,
  Trash2,
  RotateCcw,
  ChevronRight,
  X,
  Download,
} from "lucide-vue-next";
import DealSummaryModal from "../components/DealSummaryModal.vue";
import TransportList from "..//components/TransportList.vue";
import ConfirmModal from "../components/ConfirmModalDelete.vue";
import TablePagination from "../components/TablePagination.vue";
import note from "@/assets/images/note.png";
import {
  ref,
  computed,
  onMounted,
  onBeforeUnmount,
  watch,
  nextTick,
  reactive,
} from "vue";
import CustomerIdentity from "../components/CustomerIdentity.vue";
import api from "../api/api";

// State
const selectedCustomer = ref(null);
const deals = ref([]);
const newCustomers = ref([]);
const combinedData = ref([]);
const searchKeyword = ref("");
const filterDate = ref("");
const filterProgress = ref("all");
const selectedSegmen = ref("all");
const isLoading = ref(false);

const customerDropdownRef = ref(null);
const showProgressDropdown = ref(false);
const showSegmenDropdown = ref(false);

const showCustomerDropdown = ref(false);
const selectedCustomerText = ref("");

const isEditing = ref(false);
const originalDealData = ref(null);

const alertMessage = ref("");
const alertType = ref("");
const showAlert = ref(false);

const loading = ref(false);

const currentPage = ref(1);
const pageSize = ref(10);
const totalItems = ref(0);

const customerSearch = ref("");

const showEditCountryModal = ref(false);
const newEditCountryInput = ref("");
const newEditCountryCategory = ref("");
const showEditCategoryDropdown = ref(false);

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
  hotel: [""],
  notes: "",
});

const dealForm = ref({
  id: null,
  new_customer_id: "",
  handler: "",
  link_drive: "",
  total_pax: "",
  activity: "",
  note_hotel: "",
  note_resto: "",
  payment_status: "",

  transport: [
    {
      guide: "",
      hp_guide: "",
      driver: "",
      hp_driver: "",
      note_operation: "",
      report: "",
      foto: [],
    },
  ],

  reservations: [
    {
      tour_plan: "",
      phone_hotel: "",
      lokasi_hotel: "",
      lunches: [{ lunch: "", phone: "", lokasi: "" }],
      dinners: [{ dinner: "", phone: "", lokasi: "" }],
      activities: [{ activity: "", phone: "", lokasi: "" }],
    },
  ],
});

const showProgress = ref(false);
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

const selectEditCountry = (country) => {
  editFormNewCustomer.value.country = country;
  showEditCountryModal.value = false;
};

const deleteEditCountry = (category, country) => {
  countryCategories.value[category] = countryCategories.value[category].filter(
    (c) => c !== country
  );

  if (editFormNewCustomer.value.country === country) {
    editFormNewCustomer.value.country = "";
  }
};

const closeEditCountryModal = () => {
  showEditCountryModal.value = false;
};

const selectEditCategory = (category) => {
  newEditCountryCategory.value = category;
  showEditCategoryDropdown.value = false;
};

const alertMessageFormDeal = ref("");
const alertColor = ref("red");

const showAlertFormDeal = (message, color = "red") => {
  alertMessageFormDeal.value = message;
  alertColor.value = color;
  setTimeout(() => (alertMessageFormDeal.value = ""), 4000);
};

const addNewEditCountryToCategory = () => {
  const country = newEditCountryInput.value.trim();
  const category = newEditCountryCategory.value;

  if (!country && !category) {
    showAlertFormDeal("Isi nama negara & pilih kategori!", "red");
    return;
  }

  if (!country) {
    showAlertFormDeal("Nama negara wajib diisi!", "red");
    return;
  }

  if (!category) {
    showAlertFormDeal("Pilih kategori negara!", "red");
    return;
  }

  if (!countryCategories.value[category].includes(country)) {
    countryCategories.value[category].push(country);
  }

  editFormNewCustomer.value.country = country;

  newEditCountryInput.value = "";
  newEditCountryCategory.value = "";
  showEditCountryModal.value = false;
};

const showDeleteModal = ref(false);
const selectedId = ref(null);
const deleteType = ref(null);
const deletedDealCustomerIds = ref(
  JSON.parse(sessionStorage.getItem("deletedDealCustomerIds") || "[]")
);

const loadData = async () => {
  loading.value = true;
  try {
    const [ncRes, dcRes] = await Promise.all([
      api.get("/new-customer"),
      api.get("/deal-customer"),
    ]);

    newCustomers.value = ncRes.data?.data || [];
    deals.value = dcRes.data?.data || [];
    deletedDealCustomerIds.value = dcRes.data?.deleted_new_customer_ids || [];

    combinedData.value = newCustomers.value
      .filter((nc) => nc.progress?.toLowerCase() === "deal")
      .map((nc) => {
        const deal = deals.value.find(
          (d) => Number(d.new_customer_id) === Number(nc.id)
        );

        if (deal) {
          return {
            new_customer: nc,
            deal_customer: deal,
          };
        }

        if (deletedDealCustomerIds.value.includes(nc.id)) {
          return null;
        }

        return {
          new_customer: nc,
          deal_customer: {
            id: null,
            new_customer_id: nc.id,
            status: "deal-from-progress",
            is_auto: true,
          },
        };
      })
      .filter(Boolean);

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

const addTransport = () => {
  dealForm.value.transport.push({
    guide: "",
    hp_guide: "",
    driver: "",
    hp_driver: "",
    note_operation: "",
    report: "",
    foto: [],
  });
};

const deletedTransportIds = ref([]);
const removeTransport = (index) => {
  const tr = dealForm.value.transport[index];
  if (tr?.id) {
    deletedTransportIds.value.push(tr.id);
  }

  dealForm.value.transport.splice(index, 1);
};

const showDateAlert = reactive({ reservation: false });
const addReservation = () => {
  const checkIn =
    dealForm.value.check_in || dealForm.value.new_customer?.check_in;
  const checkOut =
    dealForm.value.check_out || dealForm.value.new_customer?.check_out;

  if (!checkIn || !checkOut) {
    showDateAlert.reservation = true;

    setTimeout(() => {
      showDateAlert.reservation = false;
    }, 3000);
    return;
  }
  if (!Array.isArray(dealForm.value.reservations)) {
    dealForm.value.reservations = [];
  }
  dealForm.value.reservations.push({
    tour_plan: "",
    phone_hotel: "",
    lokasi_hotel: "",
    lunches: [],
    dinners: [],
    activities: [],
    date: null,
  });
};

const deletedReservationIds = ref([]);
const removeReservation = (index) => {
  const removed = dealForm.value.reservations.splice(index, 1)[0];
  if (removed?.id) {
    deletedReservationIds.value.push(removed.id);
  }
};

const addLunch = (resIndex) => {
  const res = dealForm.value.reservations[resIndex];
  if (!Array.isArray(res.lunches)) res.lunches = [];
  res.lunches.push({ name: "", phone: "", location: "" });
};

const addDinner = (resIndex) => {
  const res = dealForm.value.reservations[resIndex];
  if (!Array.isArray(res.dinners)) res.dinners = [];
  res.dinners.push({ name: "", phone: "", location: "" });
};

const addActivity = (resIndex) => {
  const res = dealForm.value.reservations[resIndex];
  if (!Array.isArray(res.activities)) res.activities = [];
  res.activities.push({ name: "", phone: "", location: "" });
};

const removeItem = (resIndex, type, index) => {
  const arr = dealForm.value.reservations[resIndex][type];
  if (!Array.isArray(arr)) return;
  arr.splice(index, 1);
};

const handleSave = async () => {
  if (!dealForm.value.new_customer_id) {
    alertType.value = "error";
    alertMessage.value = "Pilih customer terlebih dahulu.";
    showAlert.value = true;
    setTimeout(() => (showAlert.value = false), 3000);
    return;
  }

  isLoading.value = true;
  const fd = new FormData();

  // 1. Data New Customer
  if (editFormNewCustomer.value) {
    Object.keys(editFormNewCustomer.value).forEach((key) => {
      let val = editFormNewCustomer.value[key];

      if (key === "hotel" && Array.isArray(val)) val = val.join(",");

      if (val !== null && val !== undefined && typeof val !== "object") {
        fd.append(`new_customer[${key}]`, String(val));
      }
    });
  }

  fd.append("new_customer_id", dealForm.value.new_customer_id);

  // 2. Data Deal Customer
  Object.keys(dealForm.value).forEach((key) => {
    const val = dealForm.value[key];
    if (key === "transport") return;
    if (key === "payment_status" && !val) return;
    if (val !== null && val !== undefined) fd.append(key, String(val));
  });

  // 3.Data Transport + File
  dealForm.value.transport.forEach((tr, i) => {
    fd.append(`transport[${i}][id]`, tr.id ?? "");
    fd.append(`transport[${i}][guide]`, tr.guide ?? "");
    fd.append(`transport[${i}][hp_guide]`, tr.hp_guide ?? "");
    fd.append(`transport[${i}][driver]`, tr.driver ?? "");
    fd.append(`transport[${i}][hp_driver]`, tr.hp_driver ?? "");
    fd.append(`transport[${i}][note_operation]`, tr.note_operation ?? "");
    fd.append(`transport[${i}][report]`, tr.report ?? "");

    // foto existing
    (tr.foto_existing || []).forEach((old) => {
      fd.append(`transport[${i}][foto_existing][]`, old.file_name);
    });

    // foto baru
    (tr.foto || []).forEach((file) => {
      fd.append(`transport[${i}][foto][]`, file);
    });
  });

  const reservations = (
    Array.isArray(dealForm.value.reservations)
      ? dealForm.value.reservations
      : [dealForm.value.reservations]
  ).filter((res) => res && typeof res === "object");

  reservations.forEach((res, i) => {
    if (res.id) fd.append(`reservation[${i}][id]`, res.id); // <-- ID lama

    fd.append(`reservation[${i}][tour_plan]`, res.tour_plan ?? "");
    fd.append(`reservation[${i}][phone_hotel]`, res.phone_hotel ?? "");
    fd.append(`reservation[${i}][lokasi_hotel]`, res.lokasi_hotel ?? "");
    fd.append(`reservation[${i}][lunch]`, JSON.stringify(res.lunches || []));
    fd.append(`reservation[${i}][dinner]`, JSON.stringify(res.dinners || []));
    fd.append(
      `reservation[${i}][activity]`,
      JSON.stringify(res.activities || [])
    );
  });

  deletedReservationIds.value.forEach((id) => {
    fd.append("deleted_reservation_ids[]", id);
  });

  // 4. File deal customer
  dealSelectedFiles.value.forEach((file) => {
    fd.append("files[]", file);
  });

  // 5. Data Transport
  deletedTransportIds.value.forEach((id) => {
    fd.append("deleted_transport_ids[]", id);
  });

  try {
    let res;
    if (!dealForm.value.id) {
      // CREATE
      res = await api.post("/deal-customer", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    } else {
      // UPDATE
      res = await api.post(
        `/deal-customer/${dealForm.value.id}?_method=PUT`,
        fd,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
    }

    selectedDeal.value = res.data.data;
    dealSelectedFiles.value = [];

    const files = await loadFiles(
      res.data.data.id,
      dealForm.value.new_customer_id
    );

    await loadData();
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    modalFiles.value = files;
    showFileModal.value = false;

    isEditing.value = false;
  } catch (error) {
    alert("Gagal menyimpan deal customer");
  } finally {
    isLoading.value = false;
    reset();
  }
};

const confirmDelete = async () => {
  try {
    let row;
    if (deleteType.value === "deal") {
      const response = await api.delete(`/deal-customer/${selectedId.value}`);

      if (response.status === 200) {
        row = combinedData.value.find(
          (r) => r.deal_customer?.id === selectedId.value
        );

        if (row?.new_customer?.id) {
          deletedDealCustomerIds.value.push(row.new_customer.id);
          sessionStorage.setItem(
            "deletedDealCustomerIds",
            JSON.stringify(deletedDealCustomerIds.value)
          );
        }

        combinedData.value = combinedData.value.filter(
          (r) => r.deal_customer?.id !== selectedId.value
        );
      }
    } else {
      const response = await api.delete(`/new-customer/${selectedId.value}`);

      if (response.status === 200) {
        combinedData.value = combinedData.value.filter(
          (r) => r.new_customer?.id !== selectedId.value
        );
      }
    }

    showDeleteModal.value = false;

    await loadData();
  } catch (error) {
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
    note_hotel: "",
    note_resto: "",
    payment_status: "",
    transport: [
      {
        guide: "",
        hp_guide: "",
        driver: "",
        hp_driver: "",
        note_operation: "",
        report: "",
        foto: [],
      },
    ],
  };

  selectedCustomer.value = null;
  selectedCustomerText.value = "";
  isEditing.value = false;
  originalDealData.value = null;
  dealSelectedFiles.value = [];
};
onMounted(loadData);

const formatDate = (dateStr) => dateStr?.substring(0, 10) || "";
const month = ref("");
const year = ref("");
const filterMonth = ref("");
const isFiltering = ref(false);
const filteredDeals = computed(() => {
  isFiltering.value = true;

  const keyword = searchKeyword.value.trim().toLowerCase();
  const dateFilter = filterDate.value;
  const progressFilter = filterProgress.value;
  const segmenFilter = selectedSegmen.value;

  const result = combinedData.value.filter((item) => {
    const c = item.new_customer || {};
    const d = item.deal_customer || {};

    // 1. Gabungkan field Customer + Deal
    const customerDealFields = [
      c.email,
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
      d.note_hotel,
      d.note_resto,
      String(d.total_pax || ""),
      d.payment_status,
    ]
      .map((f) =>
        f === null || f === undefined ? "" : String(f).toLowerCase()
      )
      .join(" ");

    // 2. Gabungkan field Transport
    const transportFields = (d.transports || [])
      .map((t) =>
        [
          t.guide,
          t.driver,
          t.hp_guide,
          t.hp_driver,
          t.note_operation,
          t.report,
          ...(t.foto || []).map((f) => f.file_name || f.original || ""),
        ]
          .filter((f) => f)
          .map((f) => String(f).toLowerCase())
          .join(" ")
      )
      .join(" ");

    // 3. Keyword matching
    const matchesKeyword = keyword
      ? (customerDealFields + " " + transportFields).includes(keyword)
      : true;

    // 4. Filter: date, progress, segmen
    const matchesDate = dateFilter
      ? (() => {
          const filter = dateFilter;
          const checkIn = formatDate(c.check_in);
          const checkOut = formatDate(c.check_out);

          // Range check
          if (checkIn && checkOut) {
            return filter >= checkIn && filter <= checkOut;
          }

          // fallback for single date
          return [formatDate(c.date)].includes(filter);
        })()
      : true;

    const matchesMonth = filterMonth.value
      ? (() => {
          const filter = filterMonth.value;
          const checkInMonth = c.check_in?.substring(0, 7);
          const checkOutMonth = c.check_out?.substring(0, 7);
          const dateMonth = c.date?.substring(0, 7);

          if (checkInMonth && checkOutMonth) {
            return filter >= checkInMonth && filter <= checkOutMonth;
          }

          return [dateMonth, checkInMonth, checkOutMonth].includes(filter);
        })()
      : true;

    const matchesProgress =
      progressFilter && progressFilter !== "all"
        ? (c.progress || "").toLowerCase() === progressFilter.toLowerCase()
        : true;

    const matchesSegmen =
      segmenFilter && segmenFilter !== "all"
        ? (c.segmen || "").toLowerCase() === segmenFilter.toLowerCase()
        : true;

    return (
      matchesKeyword &&
      matchesMonth &&
      matchesDate &&
      matchesProgress &&
      matchesSegmen
    );
  });

  nextTick(() => {
    setTimeout(() => {
      isFiltering.value = false;
    }, 300);
  });

  return result;
});

watch(
  [searchKeyword, filterMonth, filterDate, filterProgress, selectedSegmen],
  () => {
    currentPage.value = 1;
  }
);

watch([month, year], ([m, y]) => {
  if (m && y) {
    filterMonth.value = `${y}-${m}`;
    isFiltering.value = true;
    nextTick(() => {
      setTimeout(() => {
        isFiltering.value = false;
      }, 700);
    });
  } else if (y && !m) {
    filterMonth.value = "";
    isFiltering.value = true;
    nextTick(() => {
      setTimeout(() => {
        isFiltering.value = false;
      }, 700);
    });
  } else {
    filterMonth.value = "";
  }
});

const uniqueSegmens = computed(() => {
  const seg = new Set();
  combinedData.value.forEach((item) => {
    const s = item.new_customer?.segmen;
    if (s) seg.add(s);
  });
  return Array.from(seg);
});

const isRotating = ref(false);
const resetFilters = () => {
  isRotating.value = true;
  setTimeout(() => {
    isRotating.value = false;
  }, 600);

  filterMonth.value = "";
  month.value = "";
  year.value = "";
  searchKeyword.value = "";
  filterDate.value = "";
  filterProgress.value = "all";
  selectedSegmen.value = "all";
};

const getMonth = (date) => {
  if (!date) return null;
  return date.slice(0, 7);
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

const selectProgress = (val) => {
  filterProgress.value = val;
  showProgressDropdown.value = false;
};

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
  if (!status) return "bg-slate-100 text-slate-600 border border-slate-200";

  const s = status.toString().trim().toUpperCase();

  switch (s) {
    case "NEW":
      return "bg-slate-200 text-slate-700 border border-slate-200";

    case "FOLLOW UP":
    case "FOLLOWUP":
      return "bg-yellow-200 text-yellow-800 border border-yellow-200";

    case "POSTPONE":
      return "bg-yellow-100 text-yellow-800 border border-yellow-200";

    case "PROSPECT":
      return "bg-blue-200 text-blue-800 border border-blue-200";

    case "ON PROGRESS":
      return "bg-blue-100 text-blue-800 border border-blue-200";

    case "DEAL":
      return "bg-green-100 text-green-800 border border-green-200";

    case "LOST":
    case "CANCELED":
      return "bg-red-100 text-red-800 border border-red-200";

    default:
      return "bg-slate-100 text-slate-600 border border-slate-200";
  }
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
      note_hotel: originalDealData.value.deal_customer?.note_hotel ?? "",
      note_resto: originalDealData.value.deal_customer?.note_resto ?? "",
      payment_status:
        originalDealData.value.deal_customer?.payment_status ?? "", // string: dp/lunas
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

const paginatedDataCustomers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const list = filteredDeals.value;
  totalItems.value = list.length;
  return list.slice(start, start + pageSize.value);
});

const openDeleteModal = (row) => {
  if (row.deal_customer?.id) {
    deleteType.value = "deal";
    selectedId.value = row.deal_customer.id;
  } else if (row.new_customer?.id) {
    deleteType.value = "customer";
    selectedId.value = row.new_customer.id;
  } else {
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

// Fitur Upload file deal customer & relasi new customer
const allFiles = ref([]);
const dealSelectedFiles = ref([]);
const API_BASE = "http://127.0.0.1:8000";

const loadFiles = async (dealCustomerId, newCustomerId) => {
  allFiles.value = [];

  try {
    let dealFilesApi = [];
    let newFilesApi = [];

    if (newCustomerId) {
      const newRes = await api.get(`/customer-files/${newCustomerId}`);
      newFilesApi = (newRes.data.files ?? []).map((f) => ({
        id: `nc-${f.real_id}`,
        real_id: f.real_id,
        original_name: f.original_name,
        preview_url: `${API_BASE}${f.preview_url}`,
        source: "new_customer",
      }));
    }

    if (dealCustomerId) {
      const dealRes = await api.get(`/deal-customer-files/${dealCustomerId}`);

      dealFilesApi = (dealRes.data.files ?? [])
        .filter((f) => f.real_id)
        .map((f) => ({
          id: `dc-${f.real_id}`,
          real_id: f.real_id,
          original_name: f.original_name,
          preview_url: `${API_BASE}${f.preview_url}`,
          source: "deal_customer",
        }));
    }

    // Filter only if deal files have the same name
    const filteredDealFiles = dealFilesApi.filter((df) => {
      return !newFilesApi.some(
        (nf) =>
          nf.original_name === df.original_name &&
          nf.preview_url === df.preview_url
      );
    });

    // Merge
    allFiles.value = [...newFilesApi, ...filteredDealFiles].filter(
      (f) => f.source !== "transport"
    );
  } catch (err) {}
};

const removeDealFile = async (file) => {
  if (!file?.id || file.source !== "deal_customer") return;

  try {
    await api.delete(`/deal-customer-files/${file.id.replace("dc-", "")}`);
    allFiles.value = allFiles.value.filter((f) => f.id !== file.id);
  } catch (e) {}
};

const isDealFile = (file) => {
  return String(file.source).trim() === "deal_customer";
};

const editDeal = (d) => {
  isEditing.value = true;

  const transportData = d.deal_customer?.transports?.length
    ? d.deal_customer.transports.map((t) => ({
        id: t.id,
        guide: t.guide ?? "",
        hp_guide: t.hp_guide ?? "",
        driver: t.driver ?? "",
        hp_driver: t.hp_driver ?? "",
        note_operation: t.note_operation ?? "",
        report: t.report ?? "",

        foto_existing: t.foto ?? [],
        foto: [],
      }))
    : [
        {
          id: null,
          guide: "",
          hp_guide: "",
          driver: "",
          hp_driver: "",
          note_operation: "",
          report: "",
          foto_existing: [],
          foto: [],
        },
      ];

  dealForm.value = {
    ...dealForm.value,
    transport: transportData,

    id: d.deal_customer?.id ?? null,
    new_customer_id: d.new_customer?.id ?? "",
    handler: d.deal_customer?.handler ?? "",
    link_drive: d.deal_customer?.link_drive ?? "",
    total_pax: d.deal_customer?.total_pax ?? "",
    activity: d.deal_customer?.activity ?? "",
    note_hotel: d.deal_customer?.note_hotel ?? "",
    note_resto: d.deal_customer?.note_resto ?? "",
    payment_status: d.deal_customer?.payment_status ?? "",
  };

  editFormNewCustomer.value = {
    email: d.new_customer?.email ?? "",
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
    hotel: d.new_customer?.hotel
      ? d.new_customer.hotel.split(",").map((h) => h.trim())
      : [""],

    notes: d.new_customer?.notes ?? "",
  };

  const start = d.new_customer?.check_in;
  const end = d.new_customer?.check_out;

  if (start && end) {
    const startDate = new Date(start);
    const endDate = new Date(end);

    const dateArray = [];
    let current = new Date(startDate);

    while (current <= endDate) {
      dateArray.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    const oldReservations = d.deal_customer?.reservation || [];
    const guestName = d.new_customer?.name ?? "";

    dealForm.value.reservations = dateArray.map((date, index) => {
      const dateStr = date.toISOString().split("T")[0];

      const old = oldReservations[index];

      return old
        ? {
            id: old.id,
            tour_plan: old.tour_plan ?? "",
            phone_hotel: old.phone_hotel ?? "",
            lokasi_hotel: old.lokasi_hotel ?? "",
            lunches: old.lunch ? JSON.parse(old.lunch) : [],
            dinners: old.dinner ? JSON.parse(old.dinner) : [],
            activities: old.activity ? JSON.parse(old.activity) : [],
            date: dateStr,
            guest_name: guestName,
          }
        : {
            id: null,
            tour_plan: "",
            phone_hotel: "",
            lokasi_hotel: "",
            lunches: [],
            dinners: [],
            activities: [],
            date: dateStr,
            guest_name: guestName,
          };
    });
  }

  dealSelectedFiles.value = [];
  loadFiles(d.deal_customer?.id ?? null, d.new_customer?.id ?? null);

  window.scrollTo({ top: 0, behavior: "smooth" });
};

const addEditHotel = () => {
  if (!Array.isArray(editFormNewCustomer.value.hotel)) {
    editFormNewCustomer.value.hotel = [""];
  }
  editFormNewCustomer.value.hotel.push("");
};

const removeEditHotel = (index) => {
  if (editFormNewCustomer.value.hotel.length > 1) {
    editFormNewCustomer.value.hotel.splice(index, 1);
  }
};

const showDealAlert = ref(false);
const dealAlertMessage = ref("");
const handleDealFileChange = (e) => {
  const files = Array.from(e.target.files);
  if (!files.length) return;

  dealSelectedFiles.value.push(...files);

  e.target.value = "";
};

const removeDealSelectedFile = (index) => {
  dealSelectedFiles.value.splice(index, 1);
};

// Dowload & Modal & Merge New Deal
const showFileModal = ref(false);
const modalFiles = ref([]);
const openFilePreview = async (dealId) => {
  modalFiles.value = [];

  if (!dealId) {
    showFileModal.value = true;
    return;
  }

  try {
    const res = await api.get(`/deal-customer-files/${dealId}`);

    modalFiles.value = Array.isArray(res?.data?.files) ? res.data.files : [];
    showFileModal.value = true;
  } catch (err) {
    modalFiles.value = [];
  } finally {
    showFileModal.value = true;
  }
};

const closeFileModal = () => {
  showFileModal.value = false;
};

const downloadFile = (file) => {
  let url = "";

  if (file.source === "new_customer" || file.source === "deal_customer") {
    url = `http://127.0.0.1:8000/files/download/${file.source}/${file.real_id}`;
  } else if (file.source === "transport") {
    url = `http://127.0.0.1:8000/files/download/transport/${file.transport_id}/${file.file_name}`;
  } else if (file.source === "customer_identity") {
    url = `http://127.0.0.1:8000/files/download/customer-identity/${file.original_name}`;
  }

  if (url) {
    window.open(url, "_blank");
  }
};

// Canceled from deal to new
const selectedCustomerToCancel = ref(null);
const isCancelModalOpen = ref(false);
const isLoadingModalCancel = ref(false);

const openCancelModal = (row) => {
  const customer = row?.new_customer;

  if (!customer) {
    return;
  }

  // Can only cancel if progress = "deal"
  if (!customer.progress || customer.progress.toLowerCase() !== "deal") {
    alert("Customer ini belum dalam status deal.");
    return;
  }

  selectedCustomerToCancel.value = customer;
  isCancelModalOpen.value = true;
};

const cancelDeal = async () => {
  try {
    const customer = selectedCustomerToCancel.value;
    if (!customer?.id) return;
    isLoadingModalCancel.value = true;

    await api.put(`/new-customer/${customer.id}`, { progress: "canceled" });

    await loadData();
    isCancelModalOpen.value = false;
    selectedCustomerToCancel.value = null;
  } catch (err) {
    alert("Gagal membatalkan deal.");
  } finally {
    isLoadingModalCancel.value = false;
  }
};

const isBouncing = ref(false);
const downloadPdf = () => {
  isBouncing.value = true;

  setTimeout(() => {
    window.open("http://127.0.0.1:8000/deal-customer/pdf", "_blank");
    isBouncing.value = false;
  }, 600);
};

const showHotelModal = ref(false);
const currentHotel = ref("");

const openHotelModal = (hotelData) => {
  if (!hotelData) {
    currentHotel.value = ["Tidak ada data hotel"];
  } else if (Array.isArray(hotelData)) {
    currentHotel.value = hotelData;
  } else {
    currentHotel.value = hotelData.split(",").map((h) => h.trim());
  }
  showHotelModal.value = true;
};

const closeHotelModal = () => {
  showHotelModal.value = false;
  currentHotel.value = "";
};

const instagramUrl = (val) => {
  if (!val) return "#";
  if (val.startsWith("http")) return val;
  return `https://www.instagram.com/${val.replace("@", "")}`;
};

const dropdownOpen = ref(false);
const showModal = ref(false);
const options = [
  { label: "DP", value: "dp" },
  { label: "Lunas", value: "lunas" },
];
const toggleDropdown = () => {
  dropdownOpen.value = !dropdownOpen.value;
};
const selectOption = (value) => {
  dealForm.value.payment_status = value;
  dropdownOpen.value = false;
  showModal.value = true;
};

const isImage = (filename = "") => {
  return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(filename);
};

const previewFiles = computed(() => {
  return allFiles.value.filter((f) => f.source !== "transport");
});

const modalVisible = ref(false);
const selectedDeal = ref({});

const openModal = (deal) => {
  selectedDeal.value = deal;
  modalVisible.value = true;
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

const isEditSegmenDropdownOpen = ref(false);

const editSegmenOptions = [
  {
    value: "BST Malaysia",
    label: "BST Malaysia",
    color: "bg-green-100 text-green-800 border-green-200",
  },
  {
    value: "BST Domestic",
    label: "BST Domestic",
    color: "bg-blue-100 text-blue-800 border-blue-200",
  },
  {
    value: "WBO",
    label: "WBO",
    color: "bg-purple-100 text-purple-800 border-purple-200",
  },
  {
    value: "B2B Overseas",
    label: "B2B Overseas",
    color: "bg-orange-100 text-orange-800 border-orange-200",
  },
  {
    value: "B2B Domestic",
    label: "B2B Domestic",
    color: "bg-red-100 text-red-800 border-red-200",
  },
];

const toggleEditSegmenDropdown = () => {
  isEditSegmenDropdownOpen.value = !isEditSegmenDropdownOpen.value;
};
const selectEditSegmen = (value) => {
  editFormNewCustomer.value.segmen = value;
  isEditSegmenDropdownOpen.value = false;
};
const getEditSegmenBadgeClass = (value) => {
  return (
    editSegmenOptions.find((s) => s.value === value)?.color ||
    "bg-slate-100 text-slate-700 border-slate-300"
  );
};

const isEditViaDropdownOpen = ref(false);

const editViaOptions = [
  {
    label: "IG (Instagram)",
    value: "IG",
    color: "bg-pink-100 text-pink-800 border-pink-200",
  },
  {
    label: "WA (WhatsApp)",
    value: "WA",
    color: "bg-green-100 text-green-800 border-green-200",
  },
  {
    label: "Tiktok",
    value: "Tiktok",
    color: "bg-slate-900 text-white border-slate-900",
  },
  {
    label: "Email",
    value: "Email",
    color: "bg-blue-100 text-blue-800 border-blue-200",
  },
  {
    label: "Website",
    value: "Website",
    color: "bg-indigo-100 text-indigo-800 border-indigo-200",
  },
];

const toggleEditViaDropdown = () => {
  isEditViaDropdownOpen.value = !isEditViaDropdownOpen.value;
};
const selectEditVia = (value) => {
  editFormNewCustomer.value.via = value;
  isEditViaDropdownOpen.value = false;
};
const getEditViaBadgeClass = (value) => {
  return (
    editViaOptions.find((v) => v.value === value)?.color ||
    "bg-slate-100 text-slate-700 border-slate-300"
  );
};
</script>

<template>
  <div class="container p-4 max-w-sm md:max-w-3xl lg:max-w-6xl mx-auto">
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="-translate-y-6 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="-translate-y-6 opacity-0"
    >
      <div
        v-if="showDealAlert"
        class="fixed top-4 left-1/2 -translate-x-1/2 z-9999 w-[90%] max-w-xl bg-red-600 text-white px-5 py-3 rounded-lg shadow-lg flex items-center justify-between"
      >
        <span class="text-sm font-medium">
          {{ dealAlertMessage }}
        </span>

        <button
          @click="showDealAlert = false"
          class="ml-4 text-white hover:text-red-200"
        >
          ✕
        </button>
      </div>
    </Transition>

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

    <div class="flex items-start gap-3 mb-6">
      <img
        :src="note"
        alt="New Customer"
        class="w-18 h-18 object-contain shrink-0"
      />
      <div>
        <h2 class="text-xl font-bold text-black tracking-tight">
          Deal Customer
        </h2>
        <p class="text-md text-slate-600">
          See all deal, new customer, new chat, and summary report
        </p>
      </div>
    </div>
    <!-- Form deal customer -->
    <div
      v-if="isEditing"
      class="bg-white rounded-xl shadow border border-slate-200 p-6 mb-8"
    >
      <h3 class="text-lg font-semibold mb-4 text-slate-700">
        Form Deal Customer
      </h3>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-5 text-[15px]">
        <div class="flex flex-col">
          <label
            class="flex items-center gap-1 mb-1 font-medium text-slate-700"
          >
            Date
          </label>

          <input
            v-model="editFormNewCustomer.date"
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
            v-model="editFormNewCustomer.phone"
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
            v-model="editFormNewCustomer.email"
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
            v-model="editFormNewCustomer.name"
            placeholder="Guest Name"
            class="p-3 rounded-lg border border-slate-300 ring-1 ring-blue-50 focus:outline-none"
          />
        </div>

        <div class="flex flex-col mb-3">
          <label class="font-medium text-slate-700">Progress </label>

          <div class="relative">
            <div
              @click="showProgress = !showProgress"
              class="p-3 bg-white rounded-lg border border-slate-300 cursor-pointer flex items-center justify-between"
            >
              <span class="text-slate-700">
                {{ editFormNewCustomer.progress || "Select progress" }}
              </span>

              <ChevronRight
                class="w-4 h-4 text-slate-500 transition-transform"
                :class="showProgress ? 'rotate-90' : ''"
              />
            </div>

            <ul
              v-if="showProgress"
              class="absolute left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-slate-200 z-50 max-h-48 overflow-y-auto"
            >
              <li
                v-for="option in progressOptions"
                :key="option.value"
                @click="
                  editFormNewCustomer.progress = option.value;
                  showProgress = false;
                "
                class="px-4 py-2 cursor-pointer hover:bg-blue-50 flex items-center gap-2"
              >
                <!-- Badge dengan warna -->
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

        <div class="flex flex-col mb-3">
          <label
            class="flex items-center gap-1 mb-1 font-medium text-slate-700"
          >
            PIC
          </label>

          <input
            v-model="editFormNewCustomer.pic"
            placeholder="PIC"
            readonly
            class="p-3 rounded-lg border border-slate-300 ring-1 ring-blue-50 bg-slate-100 cursor-not-allowed focus:outline-none"
          />
        </div>
        <div class="flex flex-col mb-3 relative">
          <label
            class="flex items-center gap-1 mb-1 font-medium text-slate-700"
          >
            Segmen
          </label>

          <!-- Trigger -->
          <div
            @click="toggleEditSegmenDropdown"
            class="p-3 bg-white rounded-lg border border-slate-300 cursor-pointer select-none flex items-center justify-between"
          >
            <!-- Selected badge -->
            <span
              v-if="editFormNewCustomer.segmen"
              :class="[
                'px-3 py-1 text-xs rounded-full border font-medium',
                getEditSegmenBadgeClass(editFormNewCustomer.segmen),
              ]"
            >
              {{ editFormNewCustomer.segmen }}
            </span>

            <span v-else class="text-slate-700">Select segmen</span>

            <ChevronRight
              class="w-4 h-4 text-slate-500 transition-transform duration-200"
              :class="isEditSegmenDropdownOpen ? 'rotate-90' : 'rotate-0'"
            />
          </div>

          <!-- Dropdown -->
          <ul
            v-if="isEditSegmenDropdownOpen"
            class="absolute left-0 right-0 mt-21 bg-white rounded-lg shadow-lg border border-slate-200 z-50"
          >
            <li
              v-for="option in editSegmenOptions"
              :key="option.value"
              @click="selectEditSegmen(option.value)"
              class="px-4 py-2 cursor-pointer flex items-center gap-2 hover:bg-blue-50"
            >
              <span
                :class="[
                  'w-[140px] px-2 py-1 text-xs text-center rounded-full font-medium border',
                  option.color,
                ]"
              >
                {{ option.label }}
              </span>
            </li>
          </ul>
        </div>

        <div class="flex flex-col mb-3 relative">
          <label
            class="flex items-center gap-1 mb-1 font-medium text-slate-700"
          >
            Via
          </label>

          <!-- Trigger -->
          <div
            @click="toggleEditViaDropdown"
            class="p-3 bg-white rounded-lg border border-slate-300 cursor-pointer select-none flex items-center justify-between"
          >
            <!-- Selected badge -->
            <span
              v-if="editFormNewCustomer.via"
              :class="[
                'px-3 py-1 text-xs rounded-full border font-medium',
                getEditViaBadgeClass(editFormNewCustomer.via),
              ]"
            >
              {{ editFormNewCustomer.via }}
            </span>

            <span v-else class="text-slate-700">Select via</span>

            <ChevronRight
              class="w-4 h-4 text-slate-500 transition-transform duration-200"
              :class="isEditViaDropdownOpen ? 'rotate-90' : 'rotate-0'"
            />
          </div>

          <!-- Dropdown -->
          <ul
            v-if="isEditViaDropdownOpen"
            class="absolute left-0 right-0 mt-21 bg-white rounded-lg shadow-lg border border-slate-200 z-50"
          >
            <li
              v-for="option in editViaOptions"
              :key="option.value"
              @click="selectEditVia(option.value)"
              class="px-4 py-2 cursor-pointer flex items-center gap-2 hover:bg-blue-50"
            >
              <span
                :class="[
                  'w-[140px] px-2 py-1 text-xs text-center rounded-full font-medium border',
                  option.color,
                ]"
              >
                {{ option.label }}
              </span>
            </li>
          </ul>
        </div>

        <div class="flex flex-col mb-3">
          <label class="font-medium text-slate-700"> Country </label>

          <div
            @click="showEditCountryModal = true"
            class="p-3 bg-white rounded-lg border border-slate-300 cursor-pointer flex items-center justify-between hover:shadow-sm transition"
          >
            <span class="text-slate-700 truncate">
              {{ editFormNewCustomer.country || "Select country" }}
            </span>

            <ChevronRight
              class="w-4 h-4 text-slate-500 transition-transform"
              :class="showEditCountryModal ? 'rotate-90' : ''"
            />
          </div>
        </div>
        <transition name="modal-zoom" appear>
          <div
            v-if="showEditCountryModal"
            class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            @click.self="closeEditCountryModal"
          >
            <div
              class="bg-white rounded-xl max-w-xl w-full shadow-2xl relative overflow-hidden"
            >
              <!-- ALERT -->
              <div
                v-if="alertMessageFormDeal"
                class="absolute top-16 left-1/2 -translate-x-1/2 px-5 py-2 rounded-lg text-white font-semibold text-sm z-50"
                :class="{
                  'bg-red-600': alertColor === 'red',
                  'bg-green-600': alertColor === 'green',
                  'bg-yellow-600': alertColor === 'yellow',
                }"
              >
                {{ alertMessageFormDeal }}
              </div>

              <!-- HEADER -->
              <div class="px-6 py-5 flex justify-between items-center">
                <h3 class="text-lg font-semibold text-slate-800">
                  Select Country
                </h3>
                <button
                  @click="closeEditCountryModal"
                  class="absolute top-4 right-4 text-gray-700 hover:text-gray-800 text-xl transition"
                >
                  ✕
                </button>
              </div>

              <!-- INPUT ADD -->
              <div
                class="mt-5 px-6 py-5 flex flex-col sm:flex-row gap-3 items-center"
              >
                <input
                  v-model="newEditCountryInput"
                  placeholder="Add new country"
                  class="flex-1 p-3 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring focus:ring-blue-200 outline-none transition"
                />

                <div class="relative w-full sm:w-40">
                  <div
                    @click="
                      showEditCategoryDropdown = !showEditCategoryDropdown
                    "
                    class="p-3 bg-white rounded-lg border border-slate-200 cursor-pointer flex justify-between items-center transition"
                  >
                    <span class="text-slate-700">{{
                      newEditCountryCategory || "Select category"
                    }}</span>
                    <svg
                      class="w-4 h-4 text-slate-500 transform transition-transform duration-200"
                      :class="showCategoryDropdown ? 'rotate-180' : 'rotate-0'"
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
                    v-if="showEditCategoryDropdown"
                    class="absolute left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-40 overflow-y-auto z-50 hidden-scroll"
                  >
                    <li
                      v-for="(v, key) in countryCategories"
                      :key="key"
                      @click="selectEditCategory(key)"
                      class="px-4 py-2 hover:bg-blue-50 cursor-pointer text-slate-700 text-sm"
                    >
                      {{ key }}
                    </li>
                  </ul>
                </div>

                <button
                  @click="addNewEditCountryToCategory"
                  class="px-6 py-3 bg-linear-to-br from-indigo-700 to-blue-700 hover:from-indigo-600 hover:to-blue-600 text-white rounded-lg shadow-md transition w-full sm:w-auto font-semibold"
                >
                  Add
                </button>
              </div>

              <!-- LIST -->
              <div
                class="px-6 max-h-80 overflow-y-auto space-y-4 hidden-scroll"
              >
                <template
                  v-for="(countries, category) in countryCategories"
                  :key="category"
                >
                  <div class="bg-white rounded-xl shadow-sm p-4">
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
                        <!-- SELECT COUNTRY -->
                        <span
                          class="truncate"
                          @click="selectEditCountry(country)"
                        >
                          {{ country }}
                        </span>

                        <!-- DELETE ICON (ALWAYS VISIBLE) -->
                        <button
                          @click.stop="deleteEditCountry(category, country)"
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

        <div class="flex flex-col mb-3">
          <label
            class="flex items-center gap-1 mb-1 font-medium text-slate-700"
          >
            Social Media ID
          </label>

          <input
            v-model="editFormNewCustomer.social_media_id"
            placeholder="Social Media ID"
            class="p-3 rounded-lg border border-slate-300 ring-1 ring-blue-50 focus:outline-none"
          />
        </div>
        <div class="flex flex-col mb-3">
          <label
            class="flex items-center gap-1 mb-1 font-medium text-slate-700"
          >
            Tour Packages
          </label>

          <input
            v-model="editFormNewCustomer.tour_packages"
            placeholder="Tour Packages"
            class="p-3 rounded-lg border border-slate-300 ring-1 ring-blue-50 focus:outline-none"
          />
        </div>
        <div class="flex flex-col mb-3">
          <label
            class="flex items-center gap-1 mb-1 font-medium text-slate-700"
          >
            Check In
          </label>

          <input
            v-model="editFormNewCustomer.check_in"
            type="date"
            class="p-3 rounded-lg border border-slate-300 ring-1 ring-blue-50 focus:outline-none"
          />
        </div>
        <div class="flex flex-col mb-3">
          <label
            class="flex items-center gap-1 mb-1 font-medium text-slate-700"
          >
            Check Out
          </label>

          <input
            v-model="editFormNewCustomer.check_out"
            type="date"
            class="p-3 rounded-lg border border-slate-300 ring-1 ring-blue-50 focus:outline-none"
          />
        </div>

        <!-- HOTEL -->
        <div class="mb-5">
          <label
            class="flex items-center gap-2 mb-3 text-sm font-semibold text-slate-800"
          >
            Hotel
          </label>

          <!-- HOTEL LIST -->
          <div
            v-for="(h, index) in editFormNewCustomer.hotel || []"
            :key="index"
            class="group flex items-center gap-3 mb-3"
          >
            <input
              v-model="editFormNewCustomer.hotel[index]"
              placeholder="Enter name hotel"
              class="w-full p-3 rounded-lg border border-slate-300 ring-1 ring-blue-50 focus:outline-none"
            />

            <button
              v-if="(editFormNewCustomer.hotel || []).length > 1"
              @click="removeEditHotel(index)"
              type="button"
              class="w-10 h-10 text-red-600"
            >
              ✕
            </button>
          </div>

          <!-- ADD BUTTON -->
          <button
            type="button"
            @click="addEditHotel"
            class="cursor-pointer inline-flex items-center gap-1 mt-1 px-4 py-2.5 rounded-lg bg-slate-800 text-white text-sm font-semibold shadow-md hover:shadow-lg transition"
          >
            <span class="text-lg leading-none">＋</span>
            Add Hotel
          </button>
        </div>
      </div>

      <div class="">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5 text-[15px] mb-5">
          <!-- Handler -->
          <div>
            <label class="font-medium text-slate-700"> Handler </label>
            <input
              v-model="dealForm.handler"
              class="w-full border-[1.5px] border-slate-200 rounded-lg p-3 mt-1 focus:border-slate-300 outline-none transition-all bg-white/80 backdrop-blur"
              placeholder="Handler"
            />
          </div>

          <!-- Link Drive -->
          <!-- <div>
          <label class="font-medium text-slate-700">
            Link Drive <span class="text-red-500">*</span>
          </label>
          <input
            v-model="dealForm.link_drive"
            class="w-full border-[1.5px] border-slate-200 rounded-lg p-3 mt-1 focus:border-slate-300 outline-none transition-all bg-white/80 backdrop-blur"
            placeholder="Link Drive"
          />
        </div> -->

          <!-- Total Pax -->
          <div>
            <label class="font-medium text-slate-700"> Total Pax </label>
            <input
              v-model="dealForm.total_pax"
              type="text"
              class="w-full border-[1.5px] border-slate-200 rounded-lg p-3 mt-1 focus:border-slate-300 outline-none transition-all bg-white/80 backdrop-blur"
              placeholder="Total Pax"
            />
          </div>

          <!-- Activity -->
          <!-- <div>
            <label class="font-medium text-slate-700"> Activity </label>
            <input
              v-model="dealForm.activity"
              type="text"
              class="w-full border-[1.5px] border-slate-200 rounded-lg p-3 mt-1 focus:border-slate-300 outline-none transition-all bg-white/80 backdrop-blur"
              placeholder="Activity"
            />
          </div> -->

          <!-- Note Hotel -->
          <div>
            <label class="font-medium text-slate-700">Note Hotel</label>
            <textarea
              v-model="dealForm.note_hotel"
              class="w-full border-[1.5px] border-slate-200 rounded-lg p-3 mt-1 focus:border-slate-300 outline-none transition-all bg-white/80 backdrop-blur"
              placeholder="Note Hotel"
            ></textarea>
          </div>

          <!-- Note Resto -->
          <div>
            <label class="font-medium text-slate-700">Note Resto</label>
            <textarea
              v-model="dealForm.note_resto"
              class="w-full border-[1.5px] border-slate-200 rounded-lg p-3 mt-1 focus:border-slate-300 outline-none transition-all bg-white/80 backdrop-blur"
              placeholder="Note Resto"
            ></textarea>
          </div>

          <!-- Payment Status -->
          <div class="relative w-full">
            <label class="font-medium text-slate-700"> Payment Status </label>

            <!-- Dropdown button -->
            <button
              @click="toggleDropdown"
              class="w-full flex justify-between items-center border-[1.5px] border-slate-200 rounded-lg p-3 mt-1 focus:border-slate-300 outline-none transition-all bg-white/80 backdrop-blur"
            >
              <span>{{
                dealForm.payment_status || "Pilih Payment Status"
              }}</span>
              <component
                :is="dropdownOpen ? ChevronRight : ChevronDown"
                class="w-5 h-5 transition-transform duration-200"
              />
            </button>

            <!-- Dropdown options -->
            <div
              v-if="dropdownOpen"
              class="absolute z-10 mt-1 w-full bg-white border-[1.5px] border-slate-200 rounded-lg shadow-lg"
            >
              <ul>
                <li
                  v-for="option in options"
                  :key="option.value"
                  @click="selectOption(option.value)"
                  class="p-3 cursor-pointer hover:bg-slate-100"
                >
                  {{ option.label }}
                </li>
              </ul>
            </div>

            <!-- Modal -->
            <transition
              enter-active-class="transition ease-out duration-300"
              enter-from-class="opacity-0 scale-50"
              enter-to-class="opacity-100 scale-100"
              leave-active-class="transition ease-in duration-200"
              leave-from-class="opacity-100 scale-100"
              leave-to-class="opacity-0 scale-50"
            >
              <div
                v-if="showModal"
                class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-20"
              >
                <div class="bg-white rounded-lg p-6 w-96">
                  <h2 class="text-lg font-semibold mb-4">
                    Modal Payment Status
                  </h2>
                  <p class="mb-4">
                    Anda memilih: <strong>{{ dealForm.payment_status }}</strong>
                  </p>

                  <div class="flex justify-end">
                    <button
                      @click="showModal = false"
                      class="px-4 py-2 bg-slate-800 text-white rounded-lg"
                    >
                      Tutup
                    </button>
                  </div>
                </div>
              </div>
            </transition>
          </div>
        </div>

        <!-- File Customer -->
        <div class="col-span-2">
          <h4 class="font-semibold mb-2 text-slate-700">
            Preview File New Customer, Deal Customer & Transport
          </h4>

          <!-- Preview Files -->
          <div class="flex flex-wrap gap-4 mt-3">
            <div
              v-for="file in previewFiles"
              :key="file.id"
              class="relative w-60 flex items-center justify-between gap-2 p-2 border border-slate-300 rounded-md bg-slate-100"
            >
              <a
                :href="file.preview_url"
                target="_blank"
                class="truncate text-sm font-medium text-slate-700 hover:text-blue-600"
              >
                {{ file.original_name }}
              </a>

              <button
                v-if="file.source === 'deal_customer' && file.real_id"
                @click="removeDealFile(file)"
                class="text-red-500 ml-2"
              >
                ×
              </button>
            </div>
          </div>

          <!-- Upload File Deal Customer -->
          <div class="mt-4">
            <label class="font-medium text-slate-700 mb-1 block">
              Upload File Deal Customer + Transport
            </label>
            <input
              type="file"
              multiple
              @change="handleDealFileChange"
              class="w-full border-[1.5px] border-slate-200 rounded-lg p-3 mt-1"
            />
          </div>

          <!-- Selected Files -->
          <div
            class="flex flex-wrap gap-2 mt-3"
            v-if="dealSelectedFiles.length"
          >
            <div
              v-for="(file, index) in dealSelectedFiles"
              :key="index"
              class="flex items-center justify-between gap-2 p-2 border border-slate-300 rounded-md bg-slate-100"
            >
              <span class="truncate max-w-[150px]">{{ file.name }}</span>
              <button
                type="button"
                @click="removeDealSelectedFile(index)"
                class="text-red-500 ml-2"
              >
                ×
              </button>
            </div>
          </div>
        </div>

        <!-- ================= TRANSPORT FORM ================= -->
        <div class="col-span-2 mt-8">
          <h3 class="text-lg font-semibold mb-4 text-slate-700">
            Transport Information
          </h3>

          <div
            v-for="(tr, index) in dealForm.transport"
            :key="index"
            class="border border-slate-300 rounded-xl p-5 mb-6 bg-white shadow-sm"
          >
            <div class="flex justify-between items-center mb-3">
              <h4 class="font-semibold text-slate-700">
                Transport {{ index + 1 }}
              </h4>
              <button
                v-if="dealForm.transport.length > 1"
                @click="removeTransport(index)"
                class="text-red-600 hover:text-red-800"
              >
                Hapus
              </button>
            </div>

            <div class="flex flex-col gap-5 text-[15px]">
              <div>
                <label class="font-medium text-slate-700">Guide</label>
                <input
                  v-model="tr.guide"
                  class="w-full border-[1.5px] border-slate-200 rounded-lg p-3 mt-1 focus:border-slate-300 outline-none transition-all bg-white/80 backdrop-blur"
                  placeholder="Guide"
                />
              </div>

              <div>
                <label class="font-medium text-slate-700">HP Guide</label>
                <input
                  v-model="tr.hp_guide"
                  class="w-full border-[1.5px] border-slate-200 rounded-lg p-3 mt-1 focus:border-slate-300 outline-none transition-all bg-white/80 backdrop-blur"
                  placeholder="HP Guide"
                />
              </div>

              <div>
                <label class="font-medium text-slate-700">Driver</label>
                <input
                  v-model="tr.driver"
                  class="w-full border-[1.5px] border-slate-200 rounded-lg p-3 mt-1 focus:border-slate-300 outline-none transition-all bg-white/80 backdrop-blur"
                  placeholder="Driver"
                />
              </div>

              <div>
                <label class="font-medium text-slate-700">HP Driver</label>
                <input
                  v-model="tr.hp_driver"
                  class="w-full border-[1.5px] border-slate-200 rounded-lg p-3 mt-1 focus:border-slate-300 outline-none transition-all bg-white/80 backdrop-blur"
                  placeholder="HP Driver"
                />
              </div>

              <div class="col-span-2">
                <label class="font-medium text-slate-700">Note Operation</label>
                <textarea
                  v-model="tr.note_operation"
                  class="w-full border-[1.5px] border-slate-200 rounded-lg p-3 mt-1 focus:border-slate-300 outline-none transition-all bg-white/80 backdrop-blur"
                  placeholder="Note Operation"
                ></textarea>
              </div>

              <div class="col-span-2">
                <label class="font-medium text-slate-700">Report</label>
                <textarea
                  v-model="tr.report"
                  class="w-full border-[1.5px] border-slate-200 rounded-lg p-3 mt-1 focus:border-slate-300 outline-none transition-all bg-white/80 backdrop-blur"
                  placeholder="Report"
                ></textarea>
              </div>
            </div>
          </div>

          <button
            @click="addTransport"
            class="px-4 py-2 bg-slate-800 text-white rounded-lg mb-6"
          >
            + Add Transport
          </button>
        </div>
        <!-- ================= END TRANSPORT FORM ================= -->

        <!-- ================= RESERVATION FORM ================= -->
        <div class="col-span-2 mt-8">
          <h3 class="text-lg font-semibold mb-4 text-slate-700">
            Reservation Information
          </h3>

          <div
            v-for="(rs, index) in dealForm.reservations"
            :key="index"
            class="border border-slate-300 rounded-xl p-5 mb-6 bg-white shadow-sm"
          >
            <div class="flex justify-between items-center mb-3">
              <h4 class="font-semibold text-slate-700">
                Reservation {{ index + 1 }} - {{ rs.guest_name }} -
                {{ rs.date }}
              </h4>

              <button
                v-if="dealForm.reservations.length > 1"
                @click="removeReservation(index)"
                class="text-red-600 hover:text-red-800"
              >
                Hapus
              </button>
            </div>

            <div class="flex flex-col gap-5 text-[15px]">
              <!-- Hotel -->
              <div>
                <label class="font-medium text-slate-700">Tour Plan</label>
                <input
                  v-model="rs.tour_plan"
                  class="w-full border-[1.5px] border-slate-200 rounded-lg p-3 mt-1 focus:border-slate-300 outline-none transition-all bg-white/80 backdrop-blur"
                  placeholder="Tour Plan"
                />
              </div>
              <div>
                <label class="font-medium text-slate-700">Phone Hotel</label>
                <input
                  v-model="rs.phone_hotel"
                  class="w-full border-[1.5px] border-slate-200 rounded-lg p-3 mt-1 focus:border-slate-300 outline-none transition-all bg-white/80 backdrop-blur"
                  placeholder="Phone Hotel"
                />
              </div>

              <div>
                <label class="font-medium text-slate-700">Lokasi Hotel</label>
                <input
                  v-model="rs.lokasi_hotel"
                  class="w-full border-[1.5px] border-slate-200 rounded-lg p-3 mt-1 focus:border-slate-300 outline-none transition-all bg-white/80 backdrop-blur"
                  placeholder="Lokasi Hotel"
                />
              </div>

              <!-- Activity -->
              <div
                v-for="(a, ai) in rs.activities"
                :key="ai"
                class="relative grid grid-cols-1 md:grid-cols-[1.2fr_1fr_1.2fr_auto] gap-4 items-start mb-4"
              >
                <div class="flex flex-col">
                  <label class="text-xs font-medium text-slate-600 mb-1">
                    Activity
                  </label>
                  <input
                    v-model="a.name"
                    placeholder="Activity"
                    class="w-full border-[1.5px] border-slate-200 rounded-lg p-3 focus:border-slate-300 outline-none transition-all bg-white/80 backdrop-blur"
                  />
                </div>

                <div class="flex flex-col">
                  <label class="text-xs font-medium text-slate-600 mb-1">
                    Phone
                  </label>
                  <input
                    v-model="a.phone"
                    placeholder="Phone Activity"
                    class="w-full border-[1.5px] border-slate-200 rounded-lg p-3 focus:border-slate-300 outline-none transition-all bg-white/80 backdrop-blur"
                  />
                </div>

                <div class="flex flex-col">
                  <label class="text-xs font-medium text-slate-600 mb-1">
                    Location
                  </label>
                  <input
                    v-model="a.location"
                    placeholder="Lokasi Activity"
                    class="w-full border-[1.5px] border-slate-200 rounded-lg p-3 focus:border-slate-300 outline-none transition-all bg-white/80 backdrop-blur"
                  />
                </div>

                <div class="flex items-end">
                  <button
                    @click="removeItem(index, 'activities', ai)"
                    class="h-11 w-11 text-red-600"
                    title="Remove activity"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <button
                @click="addActivity(index)"
                class="-mt-2 w-32 inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 transition"
              >
                + Add Activity
              </button>

              <!-- Lunch -->
              <div
                v-for="(l, li) in rs.lunches"
                :key="li"
                class="relative grid grid-cols-1 md:grid-cols-[1.2fr_1fr_1.2fr_auto] gap-4 items-start mb-4"
              >
                <div class="flex flex-col">
                  <label class="text-xs font-medium text-slate-600 mb-1">
                    Lunch
                  </label>
                  <input
                    v-model="l.name"
                    placeholder="Lunch"
                    class="w-full border-[1.5px] border-slate-200 rounded-lg p-3 focus:border-slate-300 outline-none transition-all bg-white/80 backdrop-blur"
                  />
                </div>

                <div class="flex flex-col">
                  <label class="text-xs font-medium text-slate-600 mb-1">
                    Phone
                  </label>
                  <input
                    v-model="l.phone"
                    placeholder="Phone Lunch"
                    class="w-full border-[1.5px] border-slate-200 rounded-lg p-3 focus:border-slate-300 outline-none transition-all bg-white/80 backdrop-blur"
                  />
                </div>

                <div class="flex flex-col">
                  <label class="text-xs font-medium text-slate-600 mb-1">
                    Location
                  </label>
                  <input
                    v-model="l.location"
                    placeholder="Lokasi Lunch"
                    class="w-full border-[1.5px] border-slate-200 rounded-lg p-3 focus:border-slate-300 outline-none transition-all bg-white/80 backdrop-blur"
                  />
                </div>

                <div class="flex items-end">
                  <button
                    @click="removeItem(index, 'lunches', li)"
                    class="h-11 w-11 text-red-600"
                    title="Remove lunch"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <button
                @click="addLunch(index)"
                class="-mt-2 w-32 inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 transition"
              >
                + Add Lunch
              </button>

              <!-- Dinner -->
              <div
                v-for="(d, di) in rs.dinners"
                :key="di"
                class="relative grid grid-cols-1 md:grid-cols-[1.2fr_1fr_1.2fr_auto] gap-4 items-start mb-4"
              >
                <div class="flex flex-col">
                  <label class="text-xs font-medium text-slate-600 mb-1">
                    Dinner
                  </label>
                  <input
                    v-model="d.name"
                    placeholder="Dinner"
                    class="w-full border-[1.5px] border-slate-200 rounded-lg p-3 focus:border-slate-300 outline-none transition-all bg-white/80 backdrop-blur"
                  />
                </div>

                <div class="flex flex-col">
                  <label class="text-xs font-medium text-slate-600 mb-1">
                    Phone
                  </label>
                  <input
                    v-model="d.phone"
                    placeholder="Phone Dinner"
                    class="w-full border-[1.5px] border-slate-200 rounded-lg p-3 focus:border-slate-300 outline-none transition-all bg-white/80 backdrop-blur"
                  />
                </div>

                <div class="flex flex-col">
                  <label class="text-xs font-medium text-slate-600 mb-1">
                    Location
                  </label>
                  <input
                    v-model="d.location"
                    placeholder="Lokasi Dinner"
                    class="w-full border-[1.5px] border-slate-200 rounded-lg p-3 focus:border-slate-300 outline-none transition-all bg-white/80 backdrop-blur"
                  />
                </div>

                <div class="flex items-end">
                  <button
                    @click="removeItem(index, 'dinners', di)"
                    class="h-11 w-11 text-red-600"
                    title="Remove dinner"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <button
                @click="addDinner(index)"
                class="-mt-2 w-32 inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 transition"
              >
                + Add Dinner
              </button>
            </div>
          </div>

          <!-- <div class="relative">
            <button
              @click="addReservation"
              class="px-4 py-2 bg-slate-800 text-white rounded-lg mb-2"
            >
              + Add Reservation
            </button>

            <span
              v-if="showDateAlert.reservation"
              class="text-red-600 text-sm block"
            >
              Harap isikan tanggal check-in dan check-out pada deal customer
            </span>
          </div> -->
        </div>
      </div>

      <!-- Save -->
      <div class="text-[15px] flex gap-2 justify-end mt-4">
        <button
          @click="handleSave"
          :disabled="isLoading"
          class="px-4 py-2 bg-linear-to-br from-indigo-700 to-blue-700 hover:from-indigo-600 hover:to-blue-600 text-white rounded-lg flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
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
          {{ isLoading ? "Memproses..." : isEditing ? "Update" : "Simpan" }}
        </button>
        <button
          v-if="isEditing"
          @click="cancelEdit"
          class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg"
        >
          Cancel Edit
        </button>
      </div>
    </div>

    <!--Filter Bar -->
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
          placeholder="Search"
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
        <!-- Bulan -->
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

        <!-- Tahun  -->
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

      <!-- Modal Bulan -->
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

      <!-- Modal Tahun -->
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

      <!-- Progress Dropdown -->
      <div class="relative" id="progress-dropdown">
        <button
          @click.stop="openOnlyProgress()"
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
            class="absolute z-50 mt-1 min-w-full bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden"
          >
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

            <div
              v-for="prog in ['on progress', 'deal', 'postpone', 'canceled']"
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
                  prog === 'postpone' &&
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

      <!-- Segmen Dropdown -->
      <div class="relative" id="segmen-dropdown">
        <button
          @click.stop="openOnlySegmen()"
          class="w-full hover:shadow-md transition border border-slate-300 rounded-lg px-3 py-2 flex items-center justify-between"
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
      <div class="lg:col-span-5 flex gap-3 justify-end mb-4">
        <button
          @click="downloadPdf"
          class="cursor-pointer inline-flex items-center gap-2 bg-linear-to-br from-indigo-700 to-blue-700 hover:from-indigo-600 hover:to-blue-600 text-white font-semibold px-5 py-2.5 rounded-lg shadow-md hover:shadow-lg transition"
        >
          <Download
            class="w-4 h-4 transition-transform"
            :class="{ 'bounce-animation': isBouncing }"
          />
          Download PDF
        </button>

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

    <!-- Table -->
    <div
      ref="tableWrapper"
      class="overflow-x-auto rounded-lg border border-slate-200 hidden-scroll cursor-grab select-none"
      @mousedown="startDrag"
      @mouseup="stopDrag"
      @mouseleave="stopDrag"
      @mousemove="onDrag"
    >
      <table class="min-w-full bg-white rounded-lg text-sm table-fixed">
        <thead class="bg-linear-to-br from-indigo-700 to-blue-700 text-white">
          <tr>
            <th
              class="px-4 py-3 w-[8%] whitespace-nowrap overflow-hidden text-ellipsis"
            >
              Actions
            </th>
            <th
              class="px-4 py-2 w-[3%] whitespace-nowrap overflow-hidden text-ellipsis"
            >
              No
            </th>
            <th
              class="px-4 py-2 w-[10%] whitespace-nowrap overflow-hidden text-ellipsis"
            >
              File
            </th>
            <th
              class="px-4 py-2 w-[8%] whitespace-nowrap overflow-hidden text-ellipsis"
            >
              Date
            </th>
            <th
              class="px-4 py-2 w-[8%] whitespace-nowrap overflow-hidden text-ellipsis"
            >
              Phone
            </th>
            <th
              class="px-4 py-2 w-[12%] whitespace-nowrap overflow-hidden text-ellipsis"
            >
              Email
            </th>
            <th
              class="px-4 py-2 w-[12%] whitespace-nowrap overflow-hidden text-ellipsis"
            >
              Guest Name
            </th>
            <th
              class="px-4 py-2 w-[6%] whitespace-nowrap overflow-hidden text-ellipsis"
            >
              Check In
            </th>
            <th
              class="px-4 py-2 w-[6%] whitespace-nowrap overflow-hidden text-ellipsis"
            >
              Check Out
            </th>
            <th
              class="px-4 py-2 w-[12%] whitespace-nowrap overflow-hidden text-ellipsis"
            >
              Tour Packages
            </th>
            <th
              class="px-4 py-2 w-[6%] whitespace-nowrap overflow-hidden text-ellipsis"
            >
              Country
            </th>
            <th
              class="px-4 py-2 w-[6%] whitespace-nowrap overflow-hidden text-ellipsis"
            >
              Progress
            </th>

            <th
              class="px-4 py-2 w-[6%] whitespace-nowrap overflow-hidden text-ellipsis"
            >
              PIC
            </th>
            <th
              class="px-4 py-2 w-[6%] whitespace-nowrap overflow-hidden text-ellipsis"
            >
              via
            </th>
            <th
              class="px-4 py-2 w-[8%] whitespace-nowrap overflow-hidden text-ellipsis"
            >
              Social Media
            </th>

            <!-- <th
              class="px-4 py-2 w-[12%] whitespace-nowrap overflow-hidden text-ellipsis"
            >
              Link Drive
            </th> -->
            <th
              class="px-4 py-2 w-[6%] whitespace-nowrap overflow-hidden text-ellipsis"
            >
              Activity
            </th>
            <th
              class="px-4 py-2 w-[4%] whitespace-nowrap overflow-hidden text-ellipsis"
            >
              Pax
            </th>
            <th
              class="px-4 py-2 w-[6%] whitespace-nowrap overflow-hidden text-ellipsis"
            >
              Segmen
            </th>
            <th
              class="px-4 py-2 w-[6%] whitespace-nowrap overflow-hidden text-ellipsis"
            >
              Handler
            </th>
            <th
              class="px-4 py-2 w-[6%] whitespace-nowrap overflow-hidden text-ellipsis"
            >
              Hotel
            </th>
            <th
              class="px-4 py-2 w-[6%] whitespace-nowrap overflow-hidden text-ellipsis"
            >
              Note Hotel
            </th>
            <th
              class="px-4 py-2 w-[6%] whitespace-nowrap overflow-hidden text-ellipsis"
            >
              Note Resto
            </th>
            <th
              class="px-4 py-2 w-[6%] whitespace-nowrap overflow-hidden text-ellipsis"
            >
              Payment Status
            </th>
            <th
              class="px-4 py-2 w-[6%] whitespace-nowrap overflow-hidden text-ellipsis"
            >
              Guide
            </th>
            <th
              class="px-4 py-2 w-[6%] whitespace-nowrap overflow-hidden text-ellipsis"
            >
              HP Guide
            </th>
            <th
              class="px-4 py-2 w-[6%] whitespace-nowrap overflow-hidden text-ellipsis"
            >
              Driver
            </th>
            <th
              class="px-4 py-2 w-[6%] whitespace-nowrap overflow-hidden text-ellipsis"
            >
              HP Driver
            </th>
            <th
              class="px-4 py-2 w-[8%] whitespace-nowrap overflow-hidden text-ellipsis"
            >
              Note Operation
            </th>
            <th
              class="px-4 py-2 w-[8%] whitespace-nowrap overflow-hidden text-ellipsis"
            >
              Report
            </th>
            <th
              class="px-4 py-2 w-[10%] whitespace-nowrap overflow-hidden text-ellipsis"
            >
              Notes
            </th>
            <th
              class="px-4 py-2 w-[10%] whitespace-nowrap overflow-hidden text-ellipsis"
            >
              Actions
            </th>
          </tr>
        </thead>

        <tbody>
          <!-- Loading -->
          <tr v-if="loading || isFiltering">
            <td colspan="40" class="p-4 space-y-2">
              <div
                class="h-4 bg-gray-300 rounded-md w-full relative overflow-hidden shimmer"
              ></div>
              <div
                class="h-4 bg-gray-300 rounded-md w-5/6 relative overflow-hidden shimmer"
              ></div>
            </td>
          </tr>

          <!-- Tidak ada data -->
          <tr
            v-else-if="
              !loading && !isFiltering && paginatedDataCustomers.length === 0
            "
          >
            <td
              colspan="31"
              class="text-center p-4 text-gray-800 font-semibold"
            >
              Data not found
            </td>
          </tr>

          <!-- List Data -->
          <tr
            v-else
            v-for="(d, i) in paginatedDataCustomers"
            :key="d.deal_customer?.id"
            class="border-b border-slate-200 hover:bg-blue-50 transition-colors"
          >
            <!-- Actions -->
            <td class="px-4 py-2 whitespace-nowrap">
              <div class="flex items-center gap-2">
                <button
                  @click="editDeal(d)"
                  class="px-2 py-2 flex items-center justify-center"
                >
                  <Pencil class="w-4 h-4 text-orange-500" />
                </button>
                <button
                  @click="openCancelModal(d)"
                  class="px-2 py-1 text-red-600 font-medium"
                >
                  Cancel
                </button>
                <button
                  @click="openDeleteModal(d)"
                  class="px-2 py-2 flex items-center justify-center"
                >
                  <Trash2 class="w-4 h-4 text-red-600" />
                </button>
              </div>
            </td>

            <td class="px-4 py-2 whitespace-nowrap">
              {{ (currentPage - 1) * pageSize + i + 1 }}
            </td>

            <td class="px-4 py-2 whitespace-nowrap">
              <button
                @click="openFilePreview(d.deal_customer?.id)"
                class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 hover:text-blue-800 transition"
              >
                View
              </button>
            </td>

            <!-- New Customer -->
            <td class="px-4 py-2 whitespace-nowrap">
              {{ d.new_customer?.date ?? "-" }}
            </td>
            <td class="px-4 py-2 whitespace-nowrap">
              {{ d.new_customer?.phone ?? "-" }}
            </td>
            <td class="px-4 py-2 whitespace-nowrap">
              {{ d.new_customer?.email ?? "-" }}
            </td>
            <td class="px-4 py-2">
              <button
                @click="openModal(d)"
                class="relative rounded px-1 transition text-blue-700 hover:text-blue-800 hover:bg-slate-100 hover:underline focus:outline-none"
              >
                {{ d.new_customer?.name ?? "-" }}
              </button>
            </td>

            <td class="px-4 py-2 whitespace-nowrap">
              {{ d.new_customer?.check_in ?? "-" }}
            </td>
            <td class="px-4 py-2 whitespace-nowrap">
              {{ d.new_customer?.check_out ?? "-" }}
            </td>
            <td class="px-4 py-2 whitespace-nowrap">
              {{ d.new_customer?.tour_packages ?? "-" }}
            </td>
            <td class="px-4 py-2 whitespace-nowrap">
              {{ d.new_customer?.country ?? "-" }}
            </td>

            <!-- Progress -->
            <td class="px-4 py-2 whitespace-nowrap">
              <span
                :class="[
                  'inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-semibold w-28',
                  progressColor(d.new_customer?.progress),
                ]"
              >
                {{ d.new_customer?.progress ?? "-" }}
              </span>
            </td>

            <td class="px-4 py-2 whitespace-nowrap">
              {{ d.new_customer?.pic ?? "-" }}
            </td>
            <td class="px-4 py-2 whitespace-nowrap">
              {{ d.new_customer?.via ?? "-" }}
            </td>
            <td class="px-4 py-2 whitespace-nowrap">
              <a
                v-if="d.new_customer?.social_media_id"
                :href="instagramUrl(d.new_customer.social_media_id)"
                target="_blank"
                rel="noopener"
                class="inline-flex items-center gap-1 text-blue-600 underline hover:text-blue-800"
              >
                {{ d.new_customer.social_media_id ?? "-" }}
              </a>

              <span v-else>-</span>
            </td>

            <!-- <td class="px-4 py-2 whitespace-nowrap">
              {{ d.deal_customer?.link_drive ?? "-" }}
            </td> -->
            <td class="px-4 py-2 whitespace-nowrap">
              {{ d.deal_customer?.activity ?? "-" }}
            </td>
            <td class="px-4 py-2 whitespace-nowrap">
              {{ d.deal_customer?.total_pax ?? "-" }}
            </td>
            <td class="px-4 py-2 whitespace-nowrap">
              {{ d.new_customer?.segmen ?? "-" }}
            </td>

            <td class="px-4 py-2 whitespace-nowrap">
              {{ d.deal_customer?.handler ?? "-" }}
            </td>
            <!-- <td class="px-4 py-2 whitespace-nowrap">
              {{ d.new_customer?.hotel }}
            </td> -->
            <td class="px-4 py-2 text-left not-[]:whitespace-nowrap">
              <button
                @click="openHotelModal(d.new_customer?.hotel)"
                class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 hover:text-blue-800 transition"
              >
                View
              </button>
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
                class="fixed inset-0 z-50 flex items-center justify-center bg-black/10"
                @click.self="closeHotelModal"
              >
                <div
                  class="bg-white w-full max-w-xl rounded-xl shadow-md overflow-hidden"
                >
                  <!-- Header -->
                  <div
                    class="px-5 py-4 flex items-center justify-between border-slate-200"
                  >
                    <h3
                      class="flex items-center gap-2 mb-3 text-lg font-semibold text-slate-800"
                    >
                      Hotel List
                      <span class="ml-2 text-sm text-gray-500"
                        >({{ currentHotel.length ?? "-" }})</span
                      >
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
                    <ul
                      v-if="currentHotel.length"
                      class="flex flex-col gap-3 max-h-80 overflow-y-auto hide-scrollbar"
                    >
                      <div
                        v-for="(hotel, index) in currentHotel"
                        :key="index"
                        class="rounded-lg border border-slate-200 px-4 py-3 bg-slate-50 hover:bg-white hover:shadow-sm transition"
                      >
                        {{ hotel.trim() }}
                      </div>
                    </ul>

                    <p v-else class="text-sm text-center text-slate-500 py-8">
                      No hotel data
                    </p>
                  </div>

                  <!-- Footer -->
                  <div class="px-5 py-4 flex justify-end border-slate-200">
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

            <td class="px-4 py-2 whitespace-nowrap">
              {{ d.deal_customer?.note_hotel ?? "-" }}
            </td>
            <td class="px-4 py-2 whitespace-nowrap">
              {{ d.deal_customer?.note_resto ?? "-" }}
            </td>
            <td class="px-4 py-2 whitespace-nowrap">
              <span
                v-if="d.deal_customer?.payment_status"
                :class="[
                  'inline-flex items-center justify-center',
                  'w-20 px-2 py-1',
                  'rounded-full text-xs font-semibold text-center',
                  d.deal_customer.payment_status === 'dp'
                    ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                    : 'bg-green-100 text-green-700 border border-green-200',
                ]"
              >
                {{ d.deal_customer.payment_status === "dp" ? "DP" : "Lunas" }}
              </span>

              <span v-else>-</span>
            </td>

            <!-- Guide / HP Guide / Driver / HP Driver -->
            <td class="px-4 py-2 whitespace-nowrap">
              {{
                d.deal_customer?.transports
                  ?.map((t) => t.guide ?? "-")
                  .join(", ")
              }}
            </td>
            <td class="px-4 py-2 whitespace-nowrap">
              {{
                d.deal_customer?.transports
                  ?.map((t) => t.hp_guide ?? "-")
                  .join(", ")
              }}
            </td>
            <td class="px-4 py-2 whitespace-nowrap">
              {{
                d.deal_customer?.transports
                  ?.map((t) => t.driver ?? "-")
                  .join(", ")
              }}
            </td>
            <td class="px-4 py-2 whitespace-nowrap">
              {{
                d.deal_customer?.transports
                  ?.map((t) => t.hp_driver ?? "-")
                  .join(", ")
              }}
            </td>
            <td class="px-4 py-2 whitespace-nowrap">
              {{
                d.deal_customer?.transports
                  ?.map((t) => t.note_operation ?? "-")
                  .join(", ")
              }}
            </td>
            <td class="px-4 py-2 whitespace-nowrap">
              {{
                d.deal_customer?.transports
                  ?.map((t) => t.report ?? "-")
                  .join(", ")
              }}
            </td>

            <td class="px-4 py-2 whitespace-nowrap">
              {{ d.new_customer?.notes ?? "-" }}
            </td>

            <!-- Actions -->
            <td class="px-4 py-2 whitespace-nowrap">
              <div class="flex items-center gap-2">
                <button
                  @click="editDeal(d)"
                  class="px-2 py-2 flex items-center justify-center"
                >
                  <Pencil class="w-4 h-4 text-orange-500" />
                </button>
                <button
                  @click="openCancelModal(d)"
                  class="px-2 py-1 text-red-600 font-medium"
                >
                  Cancel
                </button>
                <button
                  @click="openDeleteModal(d)"
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

    <!-- Cancel Modal -->
    <transition
      enter-active-class="transition ease-out duration-300"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="isCancelModalOpen"
        class="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      >
        <div class="bg-white w-80 rounded-xl shadow-md p-6">
          <!-- Title -->
          <h2 class="text-lg font-semibold text-slate-800 mb-2">
            Batalkan Deal?
          </h2>

          <!-- Description -->
          <p class="text-sm text-slate-600 leading-relaxed mb-6">
            Apakah Anda yakin ingin membatalkan deal ini? Status di
            <span class="font-medium">New Customer</span> akan berubah menjadi
            <span class="font-semibold text-red-600">CANCEL</span>.
          </p>

          <!-- Actions -->
          <div class="flex justify-end gap-3">
            <button
              class="px-4 py-2 text-sm rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 transition"
              @click="isCancelModalOpen = false"
            >
              Batal
            </button>

            <button
              class="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 transition flex items-center justify-center gap-2"
              :disabled="isLoadingModalCancel"
              @click="cancelDeal"
            >
              <svg
                v-if="isLoadingModalCancel"
                class="animate-spin h-4 w-4 text-white"
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
              <span>{{
                isLoadingModalCancel ? "Memproses..." : "Ya, Batalkan"
              }}</span>
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!--  Modal File Download -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="showFileModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md"
        @click.self="closeFileModal"
      >
        <div
          class="bg-white w-full max-w-5xl max-h-[90vh] rounded-xl shadow-md overflow-hidden"
        >
          <div class="px-8 py-6 flex items-center justify-between">
            <h2 class="text-lg font-semibold text-slate-900">
              All Files
              <span class="ml-2 text-sm text-slate-400">
                ({{ modalFiles?.length || 0 }})
              </span>
            </h2>

            <button
              @click="closeFileModal"
              class="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            >
              ✕
            </button>
          </div>

          <div
            class="px-8 pb-8 max-h-[calc(90vh-96px)] overflow-y-auto hidden-scroll"
          >
            <div
              v-if="!modalFiles || modalFiles.length === 0"
              class="flex flex-col items-center justify-center py-24 text-slate-400"
            >
              <div class="text-6xl mb-4">📂</div>
              <p class="text-sm">
                Tidak ada file new customer, deal customer, transports &
                customer identity yang tersedia
              </p>
            </div>

            <div
              v-else
              class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
            >
              <div
                v-for="file in modalFiles"
                :key="file.id"
                class="bg-slate-50 rounded-2xl p-4 hover:bg-white hover:shadow-md transition flex flex-col"
              >
                <a
                  :href="
                    file.preview_url.startsWith('http')
                      ? file.preview_url
                      : API_BASE + file.preview_url
                  "
                  target="_blank"
                  rel="noopener noreferrer"
                  class="w-full h-40 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center cursor-pointer"
                >
                  <img
                    v-if="
                      typeof file.original_name === 'string' &&
                      (file.original_name.toLowerCase().endsWith('.jpg') ||
                        file.original_name.toLowerCase().endsWith('.jpeg') ||
                        file.original_name.toLowerCase().endsWith('.png'))
                    "
                    :src="
                      file.preview_url.startsWith('http')
                        ? file.preview_url
                        : API_BASE + file.preview_url
                    "
                    class="w-full h-full object-cover"
                  />

                  <div
                    v-else
                    class="flex flex-col items-center justify-center text-slate-400 px-2"
                  >
                    <div class="text-4xl mb-1">📄</div>
                    <p class="text-xs text-center break-all">
                      {{ file.original_name }}
                    </p>
                  </div>
                </a>

                <p class="mt-3 text-xs text-slate-600 truncate">
                  {{ file.original_name }}
                </p>

                <button
                  @click="downloadFile(file)"
                  class="mt-4 inline-flex items-center justify-center gap-2 text-sm font-medium bg-linear-to-br from-indigo-700 to-blue-700 hover:from-indigo-600 hover:to-blue-600 text-white py-2.5 rounded-lg transition"
                >
                  <Download class="w-4 h-4" />
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Modal delete -->
    <ConfirmModal
      :show="showDeleteModal"
      :title="
        deleteType === 'deal' ? 'Hapus Deal Customer' : 'Hapus New Customer'
      "
      :message="
        deleteType === 'deal'
          ? 'Apakah Anda yakin ingin menghapus Deal Customer ini?'
          : 'Apakah Anda yakin ingin menghapus New Customer ini?'
      "
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

    <DealSummaryModal
      :show="modalVisible"
      :deal="selectedDeal"
      @close="modalVisible = false"
    />

    <TransportList :dealId="2" />
    <CustomerIdentity :dealId="2" />
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
