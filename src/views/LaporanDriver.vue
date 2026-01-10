<script setup>
import { ref, computed, watch, onMounted } from "vue";
import api from "../api/api";
import { useAuthStore } from "@/stores/auth";
import { ChevronLeft, ChevronRight } from "lucide-vue-next";

import headerImg from "@/assets/images/data-at-work.png";
import driverImg from "@/assets/images/male-avatar.png";
import timelineImg from "@/assets/images/travelers.png";
import dailyImg from "@/assets/images/travelers.png";

/* ================= AUTH ================= */
const auth = useAuthStore();
const user = computed(() => auth.user);

const isAdmin = computed(() =>
  user.value?.extra_roles?.some((r) => ["admin", "super_admin"].includes(r))
);

/* ================= STATE ================= */
const loading = ref(false);
const drivers = ref([]);
const selectedDriver = ref(null);

const driverInfo = ref({
  name: "-",
  phone: "-",
  note_operation: "-",
  report: "-",
});
const schedules = ref([]);
const calendarRanges = ref(new Set());
const selectedDate = ref(null);
const currentMonth = ref(new Date());

/* ================= HELPERS ================= */
const formatDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseJSON = (val) => {
  try {
    return Array.isArray(val) ? val : JSON.parse(val || "[]");
  } catch {
    return [];
  }
};

const expandDates = (start, end) => {
  const dates = [];
  let d = new Date(start + "T00:00:00");
  const last = new Date(end + "T00:00:00");

  while (d <= last) {
    dates.push(formatDate(d));
    d.setDate(d.getDate() + 1);
  }
  return dates;
};

/* ================= CORE BUILDER ================= */
const buildSchedule = (customers, driverName) => {
  schedules.value = [];
  calendarRanges.value.clear();
  selectedDate.value = null;

  customers.forEach((customer) => {
    const deal = customer.deal;
    if (!deal) return;

    const transport = deal.transports?.find(
      (t) => t.driver?.toLowerCase() === driverName.toLowerCase()
    );
    if (!transport) return;

    if (!customer.check_in || !customer.check_out) return;

    const dates = expandDates(customer.check_in, customer.check_out);
    const reservations = deal.reservation || [];

    dates.forEach((date, index) => {
      calendarRanges.value.add(date);
      const r = reservations[index] || {};

      schedules.value.push({
        date,
        tour: r.tour_plan || "-",
        guest: customer.name,
        hotel: customer.hotel || "-",
        phone_hotel: r.phone_hotel || "-",
        lokasi_hotel: r.lokasi_hotel || "-",
        lunch: parseJSON(r.lunch).map((l) => ({
          name: l.name || "-",
          phone: l.phone || "-",
          location: l.location || "-",
        })),
        dinner: parseJSON(r.dinner).map((d) => ({
          name: d.name || "-",
          phone: d.phone || "-",
          location: d.location || "-",
        })),
        activity: parseJSON(r.activity).map((a) => ({
          name: a.name || "-",
          phone: a.phone || "-",
          location: a.location || "-",
        })),
        driverInfo: {
          name: transport.driver || "-",
          phone: transport.hp_driver || "-",
          note_operation: transport.note_operation || "-",
          report: transport.report || "-",
        },
      });
    });
  });

  // Jika ada schedule, set driverInfo default dari transport pertama
  if (schedules.value.length) {
    driverInfo.value = schedules.value[0].driverInfo;
  }
};

/* ================= LOAD DRIVERS ================= */
const loadDrivers = async () => {
  loading.value = true;
  try {
    const res = await api.get("/drivers");
    const customers = res.data?.data || [];

    const map = {};
    customers.forEach((c) => {
      c.deal?.transports?.forEach((t) => {
        if (!t.driver) return;
        const driverKey = t.driver.toLowerCase();
        if (!map[driverKey]) {
          map[driverKey] = { name: t.driver };
        }
      });
    });

    drivers.value = Object.values(map); // unik berdasarkan nama
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const loadDriverData = async (driverName) => {
  loading.value = true;
  try {
    const res = await api.get("/drivers");
    buildSchedule(res.data?.data || [], driverName);
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

/* ================= WATCH ================= */
watch(selectedDriver, (d) => {
  if (d) loadDriverData(d.name);
});

// Update driverInfo saat pilih tanggal
watch(selectedDate, (date) => {
  const scheduleForDate = schedules.value.find((s) => s.date === date);
  if (scheduleForDate) {
    driverInfo.value = scheduleForDate.driverInfo;
  } else {
    driverInfo.value = {
      name: "-",
      phone: "-",
      note_operation: "-",
      report: "-",
    };
  }
});

/* ================= CALENDAR ================= */
const year = computed(() => currentMonth.value.getFullYear());
const month = computed(() => currentMonth.value.getMonth());

const monthLabel = computed(() =>
  currentMonth.value.toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  })
);

const daysInMonth = computed(() =>
  new Date(year.value, month.value + 1, 0).getDate()
);

const prevMonth = () => {
  currentMonth.value = new Date(year.value, month.value - 1, 1);
};

const nextMonth = () => {
  currentMonth.value = new Date(year.value, month.value + 1, 1);
};

const calendarDays = computed(() =>
  Array.from({ length: daysInMonth.value }, (_, i) => {
    const date = formatDate(new Date(year.value, month.value, i + 1));
    return {
      day: i + 1,
      date,
      hasRange: calendarRanges.value.has(date),
    };
  })
);

const dailySchedules = computed(() =>
  schedules.value.filter((s) => s.date === selectedDate.value)
);

const routeTimeline = computed(() =>
  schedules.value
    .filter(
      (s) =>
        new Date(s.date).getMonth() === month.value &&
        new Date(s.date).getFullYear() === year.value
    )
    .sort((a, b) => new Date(a.date) - new Date(b.date))
);

/* ================= INIT ================= */
onMounted(loadDrivers);

const showDriverModal = ref(false);
const searchDriver = ref("");
const filteredDrivers = computed(() => {
  if (!searchDriver.value) return drivers.value;

  return drivers.value.filter((d) =>
    d.name.toLowerCase().includes(searchDriver.value.toLowerCase())
  );
});
const selectDriver = (driver) => {
  selectedDriver.value = driver;
  showDriverModal.value = false;
  searchDriver.value = "";
};
</script>

<template>
  <div
    class="container p-4 max-w-sm md:max-w-3xl lg:max-w-6xl mx-auto space-y-7 min-h-screen"
  >
    <div class="-mt-5 flex items-center gap-6">
      <img
        :src="headerImg"
        alt="Header Image"
        class="w-24 h-24 object-contain"
      />
      <div>
        <h2 class="text-xl font-bold text-black tracking-tight">
          Laporan Driver
        </h2>
        <p class="text-md text-slate-600">
          Ringkasan aktivitas & Rute perjalanan driver
        </p>
      </div>
    </div>

    <!-- DRIVER SELECT -->
    <div class="bg-white rounded-lg border border-slate-200 p-5">
      <label class="text-md font-medium text-slate-600">Pilih Driver</label>

      <button
        @click="showDriverModal = true"
        class="mt-3 w-full flex items-center justify-between border border-slate-300 rounded-lg px-4 py-2 hover:bg-slate-100 transition"
      >
        <span class="text-sm text-slate-700">
          {{ selectedDriver?.name || "Search for driver name..." }}
        </span>
        <span class="text-sm text-slate-400">Search</span>
      </button>
    </div>

    <!-- MODAL SEARCH DRIVER -->
    <div
      v-if="showDriverModal"
      class="PX-2 fixed inset-0 bg-black/30 flex items-center justify-center z-50"
    >
      <div
        class="bg-white w-full max-w-md rounded-lg p-5 space-y-4 animate-scale"
      >
        <div class="flex justify-between items-center">
          <h2 class="text-sm font-medium text-slate-800">Search Driver</h2>
          <button
            @click="showDriverModal = false"
            class="text-sm text-slate-600 hover:text-slate-700"
          >
            Tutup
          </button>
        </div>

        <input
          v-model="searchDriver"
          type="text"
          placeholder="Type the driver name..."
          class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
        />

        <transition-group
          name="list"
          tag="div"
          class="max-h-64 overflow-y-auto rounded-lg hide-scrollbar"
        >
          <div
            v-for="d in filteredDrivers"
            :key="d.name"
            @click="selectDriver(d)"
            class="px-4 py-2 cursor-pointer hover:bg-blue-50 transition"
          >
            <p class="text-sm text-slate-700">{{ d.name }}</p>
          </div>
        </transition-group>

        <div
          v-if="!filteredDrivers.length"
          class="px-4 py-4 text-center text-sm text-slate-400"
        >
          Driver tidak ditemukan
        </div>
      </div>
    </div>

    <!-- CALENDAR -->
    <div class="bg-white rounded-lg border border-slate-200 p-5">
      <div class="flex justify-between items-center mb-4">
        <button
          @click="prevMonth"
          class="p-1 rounded-lg hover:bg-slate-100 transition"
        >
          <ChevronLeft class="w-4 h-4 text-slate-600" />
        </button>

        <h2 class="text-md font-medium text-black">
          {{ monthLabel }}
        </h2>

        <button
          @click="nextMonth"
          class="p-1 rounded-lg hover:bg-slate-100 transition"
        >
          <ChevronRight class="w-4 h-4 text-slate-600" />
        </button>
      </div>

      <div class="grid grid-cols-7 gap-2">
        <div
          v-for="d in calendarDays"
          :key="d.date"
          @click="selectedDate = d.date"
          class="h-9 flex items-center justify-center rounded-lg text-sm cursor-pointer transition"
          :class="[
            d.hasRange
              ? 'bg-linear-to-br from-indigo-700 to-blue-700 text-white'
              : 'bg-slate-100 text-slate-600',
            selectedDate === d.date ? 'ring-1 ring-indigo-700' : '',
          ]"
        >
          {{ d.day }}
        </div>
      </div>
    </div>

    <!-- DRIVER INFO -->
    <div
      v-if="driverInfo.name !== '-'"
      class="flex items-center gap-6 bg-white rounded-lg border border-slate-200 p-5"
    >
      <img
        :src="driverImg"
        alt="Driver"
        class="w-18 h-18 rounded-full object-contain"
      />
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
        <div>
          <p class="text-sm text-slate-500">Driver</p>
          <p class="text-sm font-medium text-black">
            {{ driverInfo.name || "-" }}
          </p>
        </div>
        <div>
          <p class="text-sm text-slate-500">Phone</p>
          <p class="text-sm text-slate-700">{{ driverInfo.phone || "-" }}</p>
        </div>
        <div>
          <p class="text-sm text-slate-500">Note Operation</p>
          <p class="text-sm text-slate-700">
            {{ driverInfo.note_operation || "-" }}
          </p>
        </div>
        <div>
          <p class="text-sm text-slate-500">Report</p>
          <p class="text-sm text-slate-700">{{ driverInfo.report || "-" }}</p>
        </div>
      </div>
    </div>

    <!-- TIMELINE -->
    <div
      v-if="routeTimeline.length"
      class="bg-white rounded-lg border border-slate-200 p-5"
    >
      <!-- HEADER TIMELINE -->
      <div class="flex items-center gap-6 mb-4">
        <img
          :src="timelineImg"
          alt="Timeline"
          class="w-24 h-24 object-contain"
        />

        <div>
          <h2 class="text-md font-medium text-slate-900">
            Daily Route Timeline
          </h2>
          <p class="text-sm text-slate-500">
            Rute perjalanan driver berdasarkan tanggal
          </p>
        </div>
      </div>

      <!-- LIST TIMELINE -->
      <div class="space-y-3">
        <div
          v-for="r in routeTimeline"
          :key="r.date"
          class="flex gap-3 items-start"
        >
          <!-- DOT -->
          <div class="w-2 h-2 mt-2 bg-blue-700 rounded-full shrink-0"></div>

          <!-- CARD -->
          <div class="flex-1 border border-slate-200 rounded-lg px-3 py-2">
            <p class="text-sm text-black mb-2">{{ r.date || "-" }}</p>
            <p class="text-sm text-black">
              {{ r.tour || "-" }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- DAILY DETAIL -->
    <div
      v-if="selectedDate"
      class="bg-white border border-slate-200 rounded-lg p-5"
    >
      <!-- HEADER -->
      <div class="flex gap-6 items-center mb-3">
        <!-- IMAGE -->
        <div class="w-28 shrink-0 flex justify-center">
          <img
            :src="dailyImg"
            alt="Daily Detail"
            class="w-24 h-24 object-contain"
          />
        </div>

        <!-- TEXT -->
        <div>
          <h2 class="text-md font-medium text-black">
            Trip Tanggal {{ selectedDate }}
          </h2>
          <p class="text-sm text-slate-500">
            Detail perjalanan driver pada tanggal ini
          </p>
        </div>
      </div>

      <!-- EMPTY STATE -->
      <div v-if="!dailySchedules.length" class="text-sm text-slate-400">
        Tidak ada trip
      </div>

      <!-- TRIP LIST (v-for BELOW HEADER) -->
      <div
        v-for="(s, i) in dailySchedules"
        :key="i"
        class="border border-slate-200 rounded-lg p-5 space-y-4"
      >
        <div class="border-l-4 border-blue-700 pl-3 mb-3">
          <p class="text-sm font-medium text-black mb-2">
            Tour Plan: {{ s.tour || "-" }}
          </p>
          <p class="text-sm text-black mb-2">
            Guest Name: {{ s.guest || "-" }} | Nama Hotel: {{ s.hotel || "-" }}
          </p>
          <p class="text-sm text-black">
            Phone Hotel: {{ s.phone_hotel || "-" }} | Lokasi Hotel:
            {{ s.lokasi_hotel || "-" }}
          </p>
        </div>

        <div class="grid md:grid-cols-3 gap-4 pt-5">
          <!-- ACTIVITY -->
          <div class="mb-4">
            <p class="text-md font-medium text-black mb-2">Activity</p>
            <div
              v-for="(a, idx) in s.activity"
              :key="idx"
              class="bg-white border border-slate-200 rounded-lg p-3 mb-2"
            >
              <p class="font-medium text-black mb-1">{{ a.name || "-" }}</p>
              <ul class="list-disc ml-5 text-sm text-slate-700">
                <li>{{ a.phone || "-" }}</li>
                <li>{{ a.location || "-" }}</li>
              </ul>
            </div>
          </div>

          <!-- LUNCH -->
          <div class="mb-4">
            <p class="text-md font-medium text-black mb-2">Lunch</p>
            <div
              v-for="(l, idx) in s.lunch"
              :key="idx"
              class="bg-white border border-slate-200 rounded-lg p-3 mb-2"
            >
              <p class="font-medium text-black mb-1">{{ l.name || "-" }}</p>
              <ul class="list-disc ml-5 text-sm text-slate-700">
                <li>{{ l.phone || "-" }}</li>
                <li>{{ l.location || "-" }}</li>
              </ul>
            </div>
          </div>

          <!-- DINNER -->
          <div class="mb-4">
            <p class="text-md font-medium text-black mb-2">Dinner</p>
            <div
              v-for="(d, idx) in s.dinner"
              :key="idx"
              class="bg-white border border-slate-200 rounded-lg p-3 mb-2"
            >
              <p class="font-medium text-black mb-1">{{ d.name || "-" }}</p>
              <ul class="list-disc ml-5 text-sm text-slate-700">
                <li>{{ d.phone || "-" }}</li>
                <li>{{ d.location || "-" }}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
