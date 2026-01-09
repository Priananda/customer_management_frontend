<script setup>
import { ref, computed, watch, onMounted } from "vue";
import api from "../api/api";
import { useAuthStore } from "@/stores/auth";

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
        lunch: parseJSON(r.lunch),
        dinner: parseJSON(r.dinner),
        activity: parseJSON(r.activity),
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
</script>

<template>
  <div class="p-6 space-y-6">
    <h1 class="text-2xl font-bold">Laporan Driver</h1>

    <!-- SELECT DRIVER -->
    <div class="bg-white p-4 rounded-xl border">
      <label class="text-sm font-medium">Pilih Driver</label>
      <select v-model="selectedDriver" class="w-full mt-2 border rounded p-2">
        <option :value="null">-- Pilih Driver --</option>
        <option v-for="d in drivers" :key="d.name" :value="d">
          {{ d.name }}
        </option>
      </select>
    </div>

    <!-- DRIVER INFO -->
    <div v-if="driverInfo.name !== '-'" class="bg-white p-4 rounded-xl border">
      <h2 class="font-semibold mb-2">Driver Information</h2>
      <p><b>Name:</b> {{ driverInfo.name }}</p>
      <p><b>Phone:</b> {{ driverInfo.phone }}</p>
      <p><b>Note Operation:</b> {{ driverInfo.note_operation }}</p>
      <p><b>Report:</b> {{ driverInfo.report }}</p>
    </div>

    <!-- TIMELINE -->
    <div v-if="routeTimeline.length" class="bg-white p-4 rounded-xl border">
      <h2 class="font-semibold mb-2">Daily Route Timeline</h2>
      <ul class="text-sm space-y-1">
        <li v-for="r in routeTimeline" :key="r.date">
          {{ r.date }} → {{ r.tour }}
        </li>
      </ul>
    </div>

    <!-- CALENDAR -->
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

    <!-- DETAIL -->
    <!-- DETAIL -->
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
</template>
