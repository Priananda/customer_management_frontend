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
import TransportList from "@/components/TransportList.vue";
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

// Milik new customer
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

// Milik Deal customer
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

  // penting!!
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
});

// Modal delete
const showDeleteModal = ref(false);
const selectedId = ref(null);
const deleteType = ref(null);

const loadData = async () => {
  loading.value = true;
  try {
    const [ncRes, dcRes] = await Promise.all([
      api.get("/new-customer"),
      api.get("/deal-customer"),
    ]);

    newCustomers.value = ncRes.data?.data || [];
    deals.value = dcRes.data?.data || [];

    // Build combinedData: hanya deal aktif
    combinedData.value = newCustomers.value
      .filter((nc) => nc.progress?.toLowerCase() === "deal") // hanya customer deal aktif
      .map((nc) => {
        const deal = deals.value.find(
          (d) => Number(d.new_customer_id) === Number(nc.id)
        );

        // Jika belum punya deal_customer, buat dummy deal
        if (!deal) {
          return {
            new_customer: nc,
            deal_customer: {
              id: null,
              new_customer_id: nc.id,
              status: "deal-from-progress",
              is_auto: true,
            },
          };
        }

        return {
          new_customer: nc,
          deal_customer: deal,
        };
      });

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

const removeTransport = (index) => {
  dealForm.value.transport.splice(index, 1);
};
const handleTransportFiles = (e, index) => {
  const files = Array.from(e.target.files);
  dealForm.value.transport[index].foto.push(...files);
};
const removeTransportFile = (transportIndex, fileIndex) => {
  dealForm.transport[transportIndex].foto.splice(fileIndex, 1);
};

// const handleSave = async () => {
//   // ensure new_customer_id exists
//   if (!dealForm.value.new_customer_id) {
//     alertType.value = "error";
//     alertMessage.value = "Pilih customer terlebih dahulu.";
//     showAlert.value = true;
//     setTimeout(() => (showAlert.value = false), 3000);
//     return;
//   }

//   const fd = new FormData();
//   isLoading.value = true;

//   // always include new_customer_id
//   fd.append("new_customer_id", dealForm.value.new_customer_id);

//   // append other fields (skip null payment_status)
//   Object.keys(dealForm.value).forEach((key) => {
//     const val = dealForm.value[key];
//     if (key === "payment_status") {
//       if (val) fd.append(key, val);
//     } else if (val !== null && val !== undefined) {
//       fd.append(key, String(val));
//     }
//   });

//   // ======================================
//   // TRANSPORT — kirim semua input + files
//   // ======================================
//   dealForm.value.transport.forEach((tr, i) => {
//     fd.append(`transport[${i}][guide]`, tr.guide ?? "");
//     fd.append(`transport[${i}][hp_guide]`, tr.hp_guide ?? "");
//     fd.append(`transport[${i}][driver]`, tr.driver ?? "");
//     fd.append(`transport[${i}][hp_driver]`, tr.hp_driver ?? "");
//     fd.append(`transport[${i}][note_operation]`, tr.note_operation ?? "");
//     fd.append(`transport[${i}][report]`, tr.report ?? "");

//     // FILE MULTIPLE
//     tr.foto.forEach((file) => {
//       fd.append(`transport[${i}][foto][]`, file);
//     });
//   });

//   // **PENTING: tambahkan file**
//   dealSelectedFiles.value.forEach((file) => {
//     fd.append("files[]", file);
//   });

//   try {
//     let res;

//     if (!dealForm.value.id) {
//       res = await api.post("/deal-customer", fd, {
//         headers: { "Content-Type": "multipart/form-data" },
//       });
//     } else {
//       res = await api.post(
//         `/deal-customer/${dealForm.value.id}?_method=PUT`,
//         fd,
//         {
//           headers: { "Content-Type": "multipart/form-data" },
//         }
//       );
//     }

//     // GET the deal ID (baru dibuat)
//     const dealId = res.data.data.id;

//     // UPLOAD MULTIPLE FILE (Wajib!!)
//     if (dealSelectedFiles.value.length > 0) {
//       const fileForm = new FormData();
//       dealSelectedFiles.value.forEach((f) => fileForm.append("files[]", f));
//       await api.post(`/deal-customer-files/upload/${dealId}`, fileForm, {
//         headers: { "Content-Type": "multipart/form-data" },
//       });
//     }

//     alertType.value = "success";
//     alertMessage.value = "Data berhasil disimpan!";
//     showAlert.value = true;

//     await loadData();
//   } catch (error) {
//     console.error("handleSave error:", error);
//     // try to show backend validation if exists
//     const msg =
//       error?.response?.data?.message ||
//       "Gagal menyimpan data! Silahkan cek input.";
//     alertType.value = "error";
//     alertMessage.value = msg;
//     showAlert.value = true;
//   } finally {
//     isLoading.value = false;
//     setTimeout(() => (showAlert.value = false), 3000);
//     reset();
//   }
// };

const handleSave = async () => {
  if (!dealForm.value.new_customer_id) {
    alertType.value = "error";
    alertMessage.value = "Pilih customer terlebih dahulu.";
    showAlert.value = true;
    setTimeout(() => (showAlert.value = false), 3000);
    return;
  }

  const fd = new FormData();
  isLoading.value = true;

  // ==========================
  // 1. NEW CUSTOMER UPDATE
  // ==========================
  // Tambahkan ini di handleSave()
  if (editFormNewCustomer.value) {
    Object.keys(editFormNewCustomer.value).forEach((key) => {
      const val = editFormNewCustomer.value[key];

      // pastikan val bukan object
      if (val !== null && val !== undefined && typeof val !== "object") {
        fd.append(`new_customer[${key}]`, String(val));
      }
    });
  }

  // ID new_customer (wajib)
  fd.append("new_customer_id", dealForm.value.new_customer_id);

  // ==========================
  // 2. DEAL CUSTOMER FIELDS
  // ==========================
  Object.keys(dealForm.value).forEach((key) => {
    const val = dealForm.value[key];
    if (key === "transport") return;
    if (key === "payment_status" && !val) return;
    if (val !== null && val !== undefined) {
      fd.append(key, String(val));
    }
  });

  // ==========================
  // DEBUG: console log FormData
  // ==========================
  console.log("=== FormData Entries ===");
  for (let pair of fd.entries()) {
    console.log(pair[0], pair[1]);
  }

  // ==========================
  // 3. TRANSPORT + FILES
  // ==========================
  dealForm.value.transport.forEach((tr, i) => {
    fd.append(`transport[${i}][id]`, tr.id ?? "");
    fd.append(`transport[${i}][guide]`, tr.guide ?? "");
    fd.append(`transport[${i}][hp_guide]`, tr.hp_guide ?? "");
    fd.append(`transport[${i}][driver]`, tr.driver ?? "");
    fd.append(`transport[${i}][hp_driver]`, tr.hp_driver ?? "");
    fd.append(`transport[${i}][note_operation]`, tr.note_operation ?? "");
    fd.append(`transport[${i}][report]`, tr.report ?? "");

    (tr.foto_existing || []).forEach((old) => {
      fd.append(`transport[${i}][foto_existing][]`, old.file_name);
    });

    tr.foto.forEach((file) => {
      fd.append(`transport[${i}][foto][]`, file);
    });
  });

  // ==========================
  // 4. FILE UMUM DEAL
  // ==========================
  dealSelectedFiles.value.forEach((file) => {
    fd.append("files[]", file);
  });

  // ==========================
  // DEBUG: cek selectedCustomer
  // ==========================
  console.log("selectedCustomer.value:", selectedCustomer.value);
  console.log("dealForm.value:", dealForm.value);

  try {
    let res;
    if (!dealForm.value.id) {
      res = await api.post("/deal-customer", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    } else {
      res = await api.post(
        `/deal-customer/${dealForm.value.id}?_method=PUT`,
        fd,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
    }

    isEditing.value = false;
    console.log("response:", res.data);
  } catch (error) {
    console.error("error:", error?.response?.data || error);
  } finally {
    isLoading.value = false;
    reset();
  }
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

// Filtered list based on search + filters
const filteredDeals = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase();
  const dateFilter = filterDate.value;
  const progressFilter = filterProgress.value;
  const segmenFilter = selectedSegmen.value;

  return combinedData.value.filter((item) => {
    const c = item.new_customer || {};
    const d = item.deal_customer || {};

    // ------------------------------
    // 1. Gabungkan field Customer + Deal
    // ------------------------------
    const customerDealFields = [
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

    // ------------------------------
    // 2. Gabungkan field Transport
    // ------------------------------
    const transportFields = (d.transports || [])
      .map((t) => {
        return [
          t.guide,
          t.driver,
          t.hp_guide,
          t.hp_driver,
          t.note_operation,
          t.report,
          ...(t.foto || []).map((f) => f.file_name || f.original || ""),
        ]
          .filter((f) => f) // buang null/undefined
          .map((f) => String(f).toLowerCase())
          .join(" ");
      })
      .join(" ");

    // ------------------------------
    // 3. Keyword matching
    // ------------------------------
    const matchesKeyword = keyword
      ? (customerDealFields + " " + transportFields).includes(keyword)
      : true;

    // ------------------------------
    // 4. Filter lain: date, progress, segmen
    // ------------------------------
    const matchesDate = dateFilter
      ? c.date?.substring(0, 10) === dateFilter ||
        c.check_in?.substring(0, 10) === dateFilter ||
        c.check_out?.substring(0, 10) === dateFilter
      : true;

    const matchesProgress =
      progressFilter && progressFilter !== "all"
        ? (c.progress || "").toLowerCase() === progressFilter.toLowerCase()
        : true;
    const matchesSegmen =
      segmenFilter && segmenFilter !== "all"
        ? (c.segmen || "").toLowerCase() === segmenFilter.toLowerCase()
        : true;

    const result =
      matchesKeyword && matchesDate && matchesProgress && matchesSegmen;
    return result;
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
    console.error(" Tidak ada ID yang bisa dihapus");
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

// MULAI DARI SINI FITUR UPLOAD FILE DEAL CUSTOMER + RELASI NEW CUSTOMER
const dealFiles = ref([]);
const customerFiles = ref([]);
const allFiles = ref([]);
const dealSelectedFiles = ref([]);
const API_BASE = "http://127.0.0.1:8000";

const loadFiles = async (dealCustomerId, newCustomerId) => {
  allFiles.value = [];

  try {
    let dealFilesApi = [];
    let newFilesApi = [];

    // --- 1. Load new customer files ---
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

    // --- 2. Load deal customer files ---
    if (dealCustomerId) {
      const dealRes = await api.get(`/deal-customer-files/${dealCustomerId}`);
      dealFilesApi = (dealRes.data.files ?? []).map((f) => ({
        id: `dc-${f.real_id}`,
        real_id: f.real_id,
        original_name: f.original_name,
        preview_url: `${API_BASE}${f.preview_url}`,
        source: "deal_customer",
      }));
    }

    // --- 3. FILTER hanya jika file DEAL punya nama sama
    //     dan PREVIEW URL-nya juga sama (benar-benar file yang sama)
    const filteredDealFiles = dealFilesApi.filter((df) => {
      return !newFilesApi.some(
        (nf) =>
          nf.original_name === df.original_name &&
          nf.preview_url === df.preview_url
      );
    });

    // --- 4. Gabungkan ---
    allFiles.value = [...newFilesApi, ...filteredDealFiles];
  } catch (err) {
    console.error("Load files failed:", err);
  }
};

const removeDealFile = async (file) => {
  if (!file?.id || file.source !== "deal_customer") return;

  if (!confirm("Yakin ingin menghapus file ini?")) return;

  try {
    await api.delete(`/deal-customer-files/${file.id.replace("dc-", "")}`);
    allFiles.value = allFiles.value.filter((f) => f.id !== file.id);
  } catch (e) {
    console.error("Delete failed:", e);
  }
};
const editDeal = (d) => {
  isEditing.value = true;

  // =============================
  // SET TRANSPORT (array input)
  // =============================
  const transportData = d.deal_customer?.transports?.length
    ? d.deal_customer.transports.map((t) => ({
        id: t.id, // ✔ PENTING: kirim ID
        guide: t.guide ?? "",
        hp_guide: t.hp_guide ?? "",
        driver: t.driver ?? "",
        hp_driver: t.hp_driver ?? "",
        note_operation: t.note_operation ?? "",
        report: t.report ?? "",

        foto_existing: t.foto ?? [], // ✔ Foto lama masuk sini
        foto: [], // file baru
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
          foto_existing: [], // kosong
          foto: [],
        },
      ];

  // ========================================
  // ASSIGN dealForm TANPA MENGHAPUS transport
  // ========================================
  dealForm.value = {
    ...dealForm.value, // <-- PENTING agar transport tidak hilang!
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

  // =============================
  // EDIT CUSTOMER INFO
  // =============================
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

  // =============================
  // FILES
  // =============================
  dealSelectedFiles.value = [];
  loadFiles(d.deal_customer?.id ?? null, d.new_customer?.id ?? null);

  window.scrollTo({ top: 0, behavior: "smooth" });
};

// // file yang sudah ada (backend)
// const dealExistingFiles = ref([]);

// Saat memilih file baru
const handleDealFileChange = (e) => {
  const files = Array.from(e.target.files);
  dealSelectedFiles.value.push(...files);
};

// Hapus file yang baru dipilih (belum diupload)
const removeDealSelectedFile = (index) => {
  dealSelectedFiles.value.splice(index, 1);
};

// // Hapus file yang sudah disimpan di backend
// const deleteDealExistingFile = async (fileId) => {
//   try {
//     await api.delete(`/deal-customer-files/${fileId}`);
//     dealExistingFiles.value = dealExistingFiles.value.filter(
//       (f) => f.id !== fileId
//     );
//   } catch (error) {
//     console.error("Delete failed:", error);
//   }
// };

// DOWLOAD + MODAL + GABUNG NEW & DEAL
const showFileModal = ref(false);
const modalFiles = ref([]);
// tombol ditekan
// const openFilePreview = async (dealId) => {
//   try {
//     const res = await api.get(`/deal-customer-files/${dealId}`);
//     modalFiles.value = res.data.files.map((f) => ({
//       ...f,
//       preview_url: API_BASE + f.preview_url,
//     }));
//     showFileModal.value = true;
//   } catch (err) {
//     console.error(err);
//   }
// };
const openFilePreview = async (dealId) => {
  try {
    const res = await api.get(`/deal-customer-files/${dealId}`);

    console.log("Res data dari backend:", res.data.files); // 🔍 cek semua file

    modalFiles.value = res.data.files.map((f) => {
      console.log("File diproses:", f); // 🔍 cek setiap file satu per satu
      return {
        ...f,
        preview_url: f.preview_url, // jangan tambah API_BASE kalau backend sudah asset()
      };
    });

    console.log("Modal files:", modalFiles.value); // 🔍 cek array yang akan dipakai di template

    showFileModal.value = true;
  } catch (err) {
    console.error(err);
  }
};

const closeFileModal = () => {
  showFileModal.value = false;
};
// const downloadFile = (file) => {
//   const url = `http://127.0.0.1:8000/files/download/${file.source}/${file.real_id}`;
//   window.open(url, "_blank");
// };

const downloadFile = (file) => {
  let url = "";

  if (file.source === "new_customer" || file.source === "deal_customer") {
    // pakai real_id untuk endpoint
    url = `http://127.0.0.1:8000/files/download/${file.source}/${file.real_id}`;
  } else if (file.source === "transport") {
    // pakai transport_id + file_name
    url = `http://127.0.0.1:8000/files/download/transport/${file.transport_id}/${file.file_name}`;
  }

  window.open(url, "_blank");
};

// FITUR CANCELED BERAWAL DARI DEAL KE CANCEL DI HALAMAN DEAL CUSTOMER
const selectedCustomerToCancel = ref(null);
const isCancelModalOpen = ref(false);

const openCancelModal = (row) => {
  const customer = row?.new_customer;

  if (!customer) {
    console.error("❌ new_customer tidak ditemukan", row);
    return;
  }

  // Hanya bisa cancel jika progress = "deal"
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

    await api.put(`/new-customer/${customer.id}`, { progress: "canceled" });

    await loadData(); // reload untuk hapus dari Deal Customer
    isCancelModalOpen.value = false;
    selectedCustomerToCancel.value = null;
  } catch (err) {
    console.error("Error canceling deal:", err);
    alert("Gagal membatalkan deal.");
  }
};

// (SEMUA HALAMAN INI ADA PENAMBAHAN LABEL PADA DEAL DAN GANTI TIPE DATA )
// Dowload PDF NEW + DEAL CUSTOMER
const downloadPdf = () => {
  window.open("http://127.0.0.1:8000/deal-customer/pdf", "_blank");
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
          <select v-model="editFormNewCustomer.progress" class="input">
            <option value="On Progress">On Progress</option>
            <option value="Canceled">Canceled</option>
            <option value="Deal">Deal</option>
          </select>
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
            type="text"
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
            type="text"
            class="w-full border-[1.5px] border-slate-200 rounded-lg p-3 mt-1 focus:border-slate-300 outline-none transition-all bg-white/80 backdrop-blur"
            placeholder="Activity"
          />
        </div>

        <!-- note_hotel -->
        <div>
          <label class="font-medium text-slate-700">Note Hotel</label>
          <textarea
            v-model="dealForm.note_hotel"
            type="text"
            class="w-full border-[1.5px] border-slate-200 rounded-lg p-3 mt-1 focus:border-slate-300 outline-none transition-all bg-white/80 backdrop-blur"
            placeholder="Note Hotel"
          ></textarea>
        </div>

        <!-- note_resto -->
        <div>
          <label class="font-medium text-slate-700">Note Resto</label>
          <textarea
            v-model="dealForm.note_resto"
            type="text"
            class="w-full border-[1.5px] border-slate-200 rounded-lg p-3 mt-1 focus:border-slate-300 outline-none transition-all bg-white/80 backdrop-blur"
            placeholder="Note Resto"
          ></textarea>
        </div>

        <!-- payment_status -->
        <div>
          <label class="font-medium text-slate-700"
            >Payment Status <span class="text-red-500">*</span></label
          >
          <select
            v-model="dealForm.payment_status"
            class="w-full border-[1.5px] border-slate-200 rounded-lg p-3 mt-1 focus:border-slate-300 outline-none transition-all bg-white/80 backdrop-blur"
          >
            <option value="" disabled>Pilih Payment Status</option>
            <option value="dp">DP</option>
            <option value="lunas">Lunas</option>
          </select>
        </div>

        <h4 class="font-semibold mb-2 text-slate-700">
          File Customer (New Customer + Deal Customer)
        </h4>

        <!-- PREVIEW ALL FILES -->
        <div class="flex flex-wrap gap-3 mt-2">
          <div
            v-for="file in allFiles"
            :key="file.id"
            class="p-2 border rounded bg-gray-100 flex items-center justify-between w-60"
          >
            <a
              :href="file.preview_url"
              target="_blank"
              class="truncate max-w-[120px]"
            >
              {{ file.original_name }}
            </a>

            <button
              v-if="file.source === 'deal_customer'"
              @click="removeDealFile(file)"
              class="text-red-500 font-bold"
            >
              x
            </button>
          </div>
        </div>

        <!-- UPLOAD FILE DEAL CUSTOMER -->
        <div class="mt-4">
          <label class="font-medium text-slate-700 mb-1 block">
            Upload File Deal Customer
          </label>

          <input
            type="file"
            multiple
            @change="handleDealFileChange"
            class="w-full border-[1.5px] border-slate-200 rounded-lg p-2 mt-1"
          />
        </div>

        <!-- SELECTED FILES (belum upload) -->
        <div class="flex flex-wrap gap-2 mt-3" v-if="dealSelectedFiles.length">
          <div
            v-for="(file, index) in dealSelectedFiles"
            :key="index"
            class="p-2 border rounded bg-slate-100 flex items-center justify-between"
          >
            <span class="truncate max-w-[150px]">{{ file.name }}</span>

            <button
              type="button"
              @click="removeDealSelectedFile(index)"
              class="text-red-500 ml-2"
            >
              x
            </button>
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
                Transport #{{ index + 1 }}
              </h4>

              <button
                v-if="dealForm.transport.length > 1"
                @click="removeTransport(index)"
                class="text-red-600 hover:text-red-800"
              >
                Hapus
              </button>
            </div>

            <!-- GRID INPUT -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5 text-[15px]">
              <div>
                <label class="font-medium text-slate-700">Guide</label>
                <input v-model="tr.guide" class="input" placeholder="Guide" />
              </div>

              <div>
                <label class="font-medium text-slate-700">HP Guide</label>
                <input
                  v-model="tr.hp_guide"
                  class="input"
                  placeholder="HP Guide"
                />
              </div>

              <div>
                <label class="font-medium text-slate-700">Driver</label>
                <input v-model="tr.driver" class="input" placeholder="Driver" />
              </div>

              <div>
                <label class="font-medium text-slate-700">HP Driver</label>
                <input
                  v-model="tr.hp_driver"
                  class="input"
                  placeholder="HP Driver"
                />
              </div>

              <div class="col-span-2">
                <label class="font-medium text-slate-700">Note Operation</label>
                <textarea
                  v-model="tr.note_operation"
                  class="input"
                  placeholder="Note Operation"
                ></textarea>
              </div>

              <div class="col-span-2">
                <label class="font-medium text-slate-700">Report</label>
                <textarea
                  v-model="tr.report"
                  class="input"
                  placeholder="Report"
                ></textarea>
              </div>

              <!-- FILE UPLOAD -->
              <!-- FILE UPLOAD -->
              <div class="col-span-2">
                <label class="font-medium text-slate-700"
                  >Upload Foto Transport</label
                >
                <input
                  type="file"
                  multiple
                  @change="handleTransportFiles($event, index)"
                  class="w-full border border-slate-300 rounded-lg p-2 mt-2 bg-white"
                />

                <!-- PREVIEW FILE GRID -->
                <div
                  class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-3"
                  v-if="tr.foto.length"
                >
                  <div
                    v-for="(file, fIndex) in tr.foto"
                    :key="fIndex"
                    class="relative p-2 bg-slate-100 rounded border flex flex-col items-center justify-center"
                  >
                    <span class="text-sm truncate max-w-full">{{
                      file.name
                    }}</span>

                    <!-- tombol hapus -->
                    <button
                      type="button"
                      @click="removeTransportFile(index, fIndex)"
                      class="absolute top-1 right-1 text-red-600 hover:text-red-800 font-bold"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- BUTTON ADD TRANSPORT -->
          <button
            @click="addTransport"
            class="px-4 py-2 bg-green-600 text-white rounded-lg mb-6"
          >
            + Tambah Transport
          </button>
        </div>
        <!-- ================= END TRANSPORT FORM ================= -->
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
          @click="downloadPdf"
          class="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Download PDF
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
            <th class="px-4 py-3 text-left w-[10%]">Actions</th>
            <th class="px-4 py-3 text-left w-[12%]">File</th>
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
            <th class="px-4 py-3 text-left w-[10%]">Note Hotel</th>
            <th class="px-4 py-3 text-left w-[10%]">Note Resto</th>
            <th class="px-4 py-3 text-left w-[10%]">Payment Status</th>

            <th class="px-4 py-2">Guide</th>
            <th class="px-4 py-2">HP Guide</th>
            <th class="px-4 py-2">Driver</th>
            <th class="px-4 py-2">HP Driver</th>
            <th class="px-4 py-2">Note Operation</th>
            <th class="px-4 py-2">Report</th>
            <!-- <th class="px-4 py-2">Foto</th> -->

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
            :key="d.deal_customer?.id"
            class="border-b border-slate-200 hover:bg-blue-50 transition-colors"
          >
            <td class="px-4 py-3 whitespace-nowrap">
              <div class="flex items-center gap-2">
                <button
                  @click="openCancelModal(d)"
                  class="px-2 py-1 bg-red-500 text-white rounded"
                >
                  Cancel
                </button>

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
            <td>
              <button
                @click="openFilePreview(d.deal_customer?.id)"
                class="text-cyan-700 underline"
              >
                Lihat Semua File
              </button>
            </td>

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

            <td>{{ d.deal_customer?.note_hotel ?? "-" }}</td>
            <td>{{ d.deal_customer?.note_resto ?? "-" }}</td>
            <td>
              <span v-if="d.deal_customer?.payment_status">
                {{ d.deal_customer.payment_status === "dp" ? "DP" : "Lunas" }}
              </span>
              <span v-else>-</span>
            </td>

            <!-- Guide -->
            <td class="px-4 py-3">
              <div
                v-for="(tr, j) in d.deal_customer?.transports || []"
                :key="tr.id || j"
              >
                {{ tr.guide ?? "-" }}
              </div>
            </td>

            <!-- HP Guide -->
            <td class="px-4 py-3">
              <div
                v-for="(tr, j) in d.deal_customer?.transports || []"
                :key="tr.id || j"
              >
                {{ tr.hp_guide ?? "-" }}
              </div>
            </td>

            <!-- Driver -->
            <td class="px-4 py-3">
              <div
                v-for="(tr, j) in d.deal_customer?.transports || []"
                :key="tr.id || j"
              >
                {{ tr.driver ?? "-" }}
              </div>
            </td>

            <!-- HP Driver -->
            <td class="px-4 py-3">
              <div
                v-for="(tr, j) in d.deal_customer?.transports || []"
                :key="tr.id || j"
              >
                {{ tr.hp_driver ?? "-" }}
              </div>
            </td>

            <!-- Note Operation -->
            <td class="px-4 py-3">
              <div
                v-for="(tr, j) in d.deal_customer?.transports || []"
                :key="tr.id || j"
              >
                {{ tr.note_operation ?? "-" }}
              </div>
            </td>

            <!-- Report -->
            <td class="px-4 py-3">
              <div
                v-for="(tr, j) in d.deal_customer?.transports || []"
                :key="tr.id || j"
              >
                {{ tr.report ?? "-" }}
              </div>
            </td>

            <!-- Foto -->
            <!-- <td class="px-4 py-3">
              <div
                v-for="(tr, j) in d.deal_customer?.transports || []"
                :key="tr.id || j"
                class="mb-1"
              >
                <span
                  v-for="foto in tr.foto"
                  :key="foto.file_name"
                  class="block"
                >
                  <a
                    :href="`http://127.0.0.1:8000/storage/${foto.path}`"
                    target="_blank"
                    class="text-blue-600 underline text-sm"
                  >
                    {{ foto.original }}
                  </a>
                </span>
              </div>
            </td> -->

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

    <!-- Cancel Modal -->
    <div
      v-if="isCancelModalOpen"
      class="fixed inset-0 bg-black/50 flex items-center justify-center"
    >
      <div class="bg-white p-5 rounded shadow-lg w-80">
        <h2 class="font-semibold text-lg mb-3">Batalkan Deal?</h2>

        <p class="text-sm mb-4">
          Apakah Anda yakin ingin membatalkan deal ini? Status di New Customer
          akan berubah menjadi <b>CANCEL</b>.
        </p>

        <div class="flex justify-end gap-2">
          <button
            class="px-3 py-1 bg-slate-300 rounded"
            @click="isCancelModalOpen = false"
          >
            Batal
          </button>

          <button
            class="px-3 py-1 bg-red-500 text-white rounded"
            @click="cancelDeal"
          >
            Ya, Cancel
          </button>
        </div>
      </div>
    </div>

    <!--  MODAL FILE DOWLOAD -->
    <div
      v-if="showFileModal"
      class="fixed inset-0 bg-black/50 flex justify-center items-center z-50"
    >
      <div class="bg-white rounded-lg w-[90%] max-w-3xl p-6 relative">
        <!-- Close button -->
        <button
          @click="closeFileModal"
          class="absolute right-3 top-3 text-slate-600 hover:text-black"
        >
          ✖
        </button>

        <h2 class="text-xl font-semibold mb-4">Semua File</h2>

        <!-- GRID -->
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          <div
            v-for="file in modalFiles"
            :key="file.id"
            class="border rounded-lg p-2 shadow-sm bg-slate-50"
          >
            <!-- Preview jika gambar -->
            <!-- <img
              v-if="
                file.original_name.endsWith('.jpg') ||
                file.original_name.endsWith('.jpeg') ||
                file.original_name.endsWith('.png')
              "
              :src="file.preview_url"
              class="h-32 w-full object-cover rounded"
            /> -->
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
              class="h-32 w-full object-cover rounded"
            />

            <!-- PDF Preview -->
            <div
              v-else-if="file.original_name.endsWith('.pdf')"
              class="h-32 flex items-center justify-center bg-red-200 rounded-lg"
            >
              <span class="text-red-800 font-semibold">PDF</span>
            </div>

            <!-- Nama file -->
            <p class="text-xs mt-2 truncate">{{ file.original_name }}</p>

            <!-- Tombol Download -->
            <button
              @click="downloadFile(file)"
              class="mt-2 text-blue-600 text-xs underline"
            >
              Download
            </button>
          </div>
        </div>
      </div>
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

    <TransportList :dealId="2" />
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
