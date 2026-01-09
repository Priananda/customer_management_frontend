<script setup>
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

// const loadDriverSchedules = async () => {
//   if (!user.value) return;

//   loading.value = true;
//   schedules.value = [];
//   calendarRanges.value.clear();
//   driverInfo.value = {
//     name: "-",
//     phone: "-",
//     note_operation: "-",
//     report: "-",
//   };

//   try {
//     const res = await api.get("/drivers");
//     const customers = res.data?.data || [];
//     const driverName = user.value.name.toLowerCase();

//     customers.forEach((customer) => {
//       const deal = customer.deal;
//       if (!deal) return;

//       const transports = deal.transports || [];

//       // ✅ FILTER DRIVER
//       const myTransport = transports.find(
//         (t) => t.driver?.toLowerCase() === driverName
//       );
//       if (!myTransport) return;

//       // ✅ AMBIL IDENTITAS DRIVER (TANPA GANGGU LOGIC)
//       if (driverInfo.value.name === "-") {
//         driverInfo.value = {
//           name: myTransport.driver || "-",
//           phone: myTransport.hp_driver || "-",
//           note_operation: myTransport.note_operation || "-",
//           report: myTransport.report || "-",
//         };
//       }

//       if (!customer.check_in || !customer.check_out) return;

//       const dates = expandDates(customer.check_in, customer.check_out);
//       const reservations = deal.reservation || [];

//       dates.forEach((date, index) => {
//         calendarRanges.value.add(date);

//         const r = reservations[index] || {};

//         schedules.value.push({
//           date,
//           tour: r.tour_plan || "-",
//           guest: customer.name,
//           hotel: customer.hotel || "-",
//           lunch: parseJSON(r.lunch),
//           dinner: parseJSON(r.dinner),
//           activity: parseJSON(r.activity),
//         });
//       });
//     });
//   } catch (err) {
//     console.error("LOAD DRIVER ERROR:", err);
//   } finally {
//     loading.value = false;
//   }
// };
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

    <!-- DRIVER INFORMATION -->
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
    <!-- DAILY ROUTE TIMELINE -->
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
