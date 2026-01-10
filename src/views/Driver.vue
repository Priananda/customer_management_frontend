<script setup>
import { ref, computed, watch } from "vue";
import api from "../api/api";
import { useAuthStore } from "@/stores/auth";
import { ChevronLeft, ChevronRight } from "lucide-vue-next";

import headerImg from "@/assets/images/data-at-work.png";
import driverImg from "@/assets/images/male-avatar.png";
import timelineImg from "@/assets/images/travelers.png";
import dailyImg from "@/assets/images/travelers.png";

const driverInfo = ref({
  name: "-",
  phone: "-",
  note_operation: "-",
  report: "-",
});

const auth = useAuthStore();
const user = computed(() => auth.user);
const isDriver = computed(() => user.value?.extra_roles?.includes("driver"));

const loading = ref(false);
const schedules = ref([]);
const calendarRanges = ref(new Set());
const selectedDate = ref(null);
const currentMonth = ref(new Date());

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

const loadDriverSchedules = async () => {
  if (!user.value) return;
  loading.value = true;
  schedules.value = [];
  calendarRanges.value.clear();

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

  try {
    const res = await api.get("/drivers");
    const customers = res.data?.data || [];
    const driverName = user.value.name.toLowerCase();

    customers.forEach((customer) => {
      const deal = customer.deal;
      if (!deal) return;
      const transports = deal.transports || [];
      const myTransport = transports.find(
        (t) => t.driver?.toLowerCase() === driverName
      );
      if (!myTransport) return;

      driverInfo.value.name =
        driverInfo.value.name === "-"
          ? myTransport.driver || "-"
          : driverInfo.value.name;
      driverInfo.value.phone =
        driverInfo.value.phone === "-"
          ? myTransport.hp_driver || "-"
          : driverInfo.value.phone;
      driverInfo.value.note_operation =
        driverInfo.value.note_operation === "-"
          ? myTransport.note_operation || "-"
          : driverInfo.value.note_operation;
      driverInfo.value.report =
        driverInfo.value.report === "-"
          ? myTransport.report || "-"
          : driverInfo.value.report;

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
            name: myTransport.driver || "-",
            phone: myTransport.hp_driver || "-",
            note_operation: myTransport.note_operation || "-",
            report: myTransport.report || "-",
          },
        });
      });
    });
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const year = computed(() => currentMonth.value.getFullYear());
const month = computed(() => currentMonth.value.getMonth());
const daysInMonth = computed(() =>
  new Date(year.value, month.value + 1, 0).getDate()
);
const monthLabel = computed(() =>
  currentMonth.value.toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  })
);
const calendarDays = computed(() => {
  const days = [];
  for (let i = 1; i <= daysInMonth.value; i++) {
    const date = formatDate(new Date(year.value, month.value, i));
    days.push({ day: i, date, hasRange: calendarRanges.value.has(date) });
  }
  return days;
});

const prevMonth = () =>
  (currentMonth.value = new Date(year.value, month.value - 1, 1));
const nextMonth = () =>
  (currentMonth.value = new Date(year.value, month.value + 1, 1));

const dailySchedules = computed(() =>
  schedules.value.filter((s) => s.date === selectedDate.value)
);

watch(
  () => user.value,
  (u) => {
    if (u && isDriver.value) loadDriverSchedules();
  },
  { immediate: true }
);

const routeTimeline = computed(() => {
  if (!schedules.value.length) return [];
  return schedules.value
    .filter(
      (s) =>
        new Date(s.date).getMonth() === month.value &&
        new Date(s.date).getFullYear() === year.value
    )
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((s, i) => ({ day: i + 1, date: s.date, route: s.tour || "-" }));
});
</script>

<template>
  <div
    class="container p-4 max-w-sm md:max-w-3xl lg:max-w-6xl mx-auto space-y-7 min-h-screen"
  >
    <div class="-mt-3 flex items-center gap-6">
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
    <div class="">
      <h2 class="-mt-5 text-xl font-bold text-black">
        Halo, {{ user?.name || "Driver tidak tersedia" }}
      </h2>
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
    <!-- CALENDAR -->
    <div class="bg-white rounded-lg border border-slate-200 p-5">
      <div class="flex justify-between items-center mb-4">
        <button
          @click="prevMonth"
          class="p-1 rounded-lg hover:bg-slate-100 transition"
        >
          <ChevronLeft class="w-4 h-4 text-slate-600" />
        </button>

        <h2 class="text-sm font-medium text-black">
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

    <!-- DAILY ROUTE TIMELINE -->
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
              {{ r.route || "-" }}
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

      <!-- TRIP LIST -->
      <div
        v-for="(s, i) in dailySchedules"
        :key="i"
        class="border border-slate-200 rounded-lg p-5 mb-4 space-y-4"
      >
        <!-- TOUR & HOTEL INFO -->
        <div class="border-l-4 border-blue-700 pl-3 mb-3">
          <p class="text-sm font-medium text-black mb-2">
            Tour Plan: {{ s.tour || "-" }}
          </p>
          <p class="text-sm text-black mb-2">
            Guest Name: {{ s.guest || "-" }} | Nama Hotel: {{ s.hotel }}
          </p>
          <p class="text-sm text-black">
            Phone Hotel: {{ s.phone_hotel || "-" }} | Lokasi Hotel:
            {{ s.lokasi_hotel || "-" }}
          </p>
        </div>

        <!-- ACTIVITY, LUNCH, DINNER -->
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

<!-- <script setup>
import { ref, computed, watch } from "vue";
import api from "../api/api";
import { useAuthStore } from "@/stores/auth";

const driverInfo = ref({
  name: "-",
  phone: "-",
  note_operation: "-",
  report: "-",
});

/* ================= AUTH ================= */
const auth = useAuthStore();
const user = computed(() => auth.user);
const isDriver = computed(() => user.value?.extra_roles?.includes("driver"));

/* ================= STATE ================= */
const loading = ref(false);
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

const loadDriverSchedules = async () => {
  if (!user.value) return;

  loading.value = true;
  schedules.value = [];
  calendarRanges.value.clear();
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

  try {
    const res = await api.get("/drivers");
    const customers = res.data?.data || [];
    const driverName = user.value.name.toLowerCase();

    customers.forEach((customer) => {
      const deal = customer.deal;
      if (!deal) return;

      const transports = deal.transports || [];

      const myTransport = transports.find(
        (t) => t.driver?.toLowerCase() === driverName
      );
      if (!myTransport) return;

      // SET DRIVER INFO JIKA FIELD MASIH "-"
      driverInfo.value.name =
        driverInfo.value.name === "-"
          ? myTransport.driver || "-"
          : driverInfo.value.name;
      driverInfo.value.phone =
        driverInfo.value.phone === "-"
          ? myTransport.hp_driver || "-"
          : driverInfo.value.phone;
      driverInfo.value.note_operation =
        driverInfo.value.note_operation === "-"
          ? myTransport.note_operation || "-"
          : driverInfo.value.note_operation;
      driverInfo.value.report =
        driverInfo.value.report === "-"
          ? myTransport.report || "-"
          : driverInfo.value.report;

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
          lunch: parseJSON(r.lunch),
          dinner: parseJSON(r.dinner),
          activity: parseJSON(r.activity),
          driverInfo: {
            // simpan info driver sesuai transport
            name: myTransport.driver || "-",
            phone: myTransport.hp_driver || "-",
            note_operation: myTransport.note_operation || "-",
            report: myTransport.report || "-",
          },
        });
      });
    });
  } catch (err) {
    console.error("LOAD DRIVER ERROR:", err);
  } finally {
    loading.value = false;
  }
};

/* ================= CALENDAR ================= */
const year = computed(() => currentMonth.value.getFullYear());
const month = computed(() => currentMonth.value.getMonth());

const daysInMonth = computed(() =>
  new Date(year.value, month.value + 1, 0).getDate()
);

const monthLabel = computed(() =>
  currentMonth.value.toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  })
);

const calendarDays = computed(() => {
  const days = [];
  for (let i = 1; i <= daysInMonth.value; i++) {
    const date = formatDate(new Date(year.value, month.value, i));
    days.push({
      day: i,
      date,
      hasRange: calendarRanges.value.has(date),
    });
  }
  return days;
});

const prevMonth = () => {
  currentMonth.value = new Date(year.value, month.value - 1, 1);
};

const nextMonth = () => {
  currentMonth.value = new Date(year.value, month.value + 1, 1);
};

/* ================= DETAIL ================= */
const dailySchedules = computed(() =>
  schedules.value.filter((s) => s.date === selectedDate.value)
);

/* ================= WATCH ================= */
watch(
  () => user.value,
  (u) => {
    if (u && isDriver.value) loadDriverSchedules();
  },
  { immediate: true }
);

const routeTimeline = computed(() => {
  if (!schedules.value.length) return [];

  return schedules.value
    .filter(
      (s) =>
        new Date(s.date).getMonth() === month.value &&
        new Date(s.date).getFullYear() === year.value
    )
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((s, index) => ({
      day: index + 1,
      date: s.date,
      route: s.tour || "-",
    }));
});
</script>

<template>
  <div class="p-6 space-y-6">
    <h1 class="text-2xl font-bold">Halo, {{ user?.name }}</h1>


    <div class="bg-white border rounded-xl p-4 mb-4">
      <h2 class="font-semibold mb-3">Driver Information</h2>

      <div class="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p class="text-gray-500">Name</p>
          <p class="font-semibold">{{ driverInfo.name }}</p>
        </div>

        <div>
          <p class="text-gray-500">Phone</p>
          <p class="font-semibold">{{ driverInfo.phone }}</p>
        </div>

        <div>
          <p class="text-gray-500">Note Operation</p>
          <p class="font-semibold">{{ driverInfo.note_operation }}</p>
        </div>

        <div>
          <p class="text-gray-500">Report</p>
          <p class="font-semibold">{{ driverInfo.report }}</p>
        </div>
      </div>
    </div>
  
    <div v-if="routeTimeline.length" class="bg-white border rounded-xl p-4">
      <h2 class="font-semibold mb-3">Daily Route Timeline</h2>

      <ul class="space-y-2 text-sm">
        <li
          v-for="r in routeTimeline"
          :key="r.date"
          class="flex items-center gap-3"
        >
          <span
            class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-semibold"
          >
            {{ r.date }}
          </span>

          <span class="font-medium"> → {{ r.route }} </span>
        </li>
      </ul>
    </div>

 
    <div class="bg-white border rounded-xl p-4">
      <div class="flex justify-between items-center mb-4">
        <button @click="prevMonth">←</button>
        <h2 class="font-semibold">{{ monthLabel }}</h2>
        <button @click="nextMonth">→</button>
      </div>

      <div class="grid grid-cols-7 gap-2 text-center">
        <div
          v-for="d in calendarDays"
          :key="d.date"
          @click="selectedDate = d.date"
          class="p-2 rounded-lg cursor-pointer text-sm"
          :class="[
            d.hasRange ? 'bg-emerald-300 line-through' : 'bg-gray-100',
            selectedDate === d.date ? 'ring-2 ring-emerald-600' : '',
          ]"
        >
          {{ d.day }}
        </div>
      </div>
    </div>


    <div v-if="selectedDate">
      <h2 class="font-semibold mb-3">Trip tanggal {{ selectedDate }}</h2>

      <div v-if="!dailySchedules.length" class="text-gray-400">
        Tidak ada trip
      </div>

      <div
        v-for="(s, i) in dailySchedules"
        :key="i"
        class="bg-white border rounded-xl p-4 mb-4 space-y-3"
      >
        <h3 class="text-lg font-semibold text-emerald-700">
          {{ s.tour }}
        </h3>

        <p class="text-sm">
          👤 Guest: <b>{{ s.guest }}</b>
        </p>
        <p class="text-sm">🏨 Hotel: {{ s.hotel }}</p>

        <div>
          <p class="font-medium text-sm">🎯 Activity</p>
          <ul v-if="s.activity.length" class="list-disc ml-5 text-sm">
            <li v-for="(a, idx) in s.activity" :key="idx">
              {{ a.name }} ({{ a.location }} | {{ a.phone }})
            </li>
          </ul>
          <p v-else class="text-gray-400 text-sm">-</p>
        </div>

        <div>
          <p class="font-medium text-sm">🍽 Lunch</p>
          <ul v-if="s.lunch.length" class="list-disc ml-5 text-sm">
            <li v-for="(l, idx) in s.lunch" :key="idx">
              {{ l.name }} ({{ l.location }} | {{ l.phone }})
            </li>
          </ul>
          <p v-else class="text-gray-400 text-sm">-</p>
        </div>

        <div>
          <p class="font-medium text-sm">🌙 Dinner</p>
          <ul v-if="s.dinner.length" class="list-disc ml-5 text-sm">
            <li v-for="(d, idx) in s.dinner" :key="idx">
              {{ d.name }} ({{ d.location }} | {{ d.phone }})
            </li>
          </ul>
          <p v-else class="text-gray-400 text-sm">-</p>
        </div>
      </div>
    </div>
  </div>
</template> -->
