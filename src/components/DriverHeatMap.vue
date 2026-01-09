<script setup>
import { ref, computed, watch } from "vue";

/* ================= ROLE ================= */
const role = ref("reservation");

/* ================= DRIVER ================= */
const drivers = ref([
  { id: 1, name: "Driver HP 1", phone: "081234567803" },
  { id: 2, name: "Driver HP 2", phone: "081234567804" },
]);

const activeDriver = ref(drivers.value[0]);

/* ================= SUMMARY ================= */
const summaries = {
  1: {
    guest: "Nanda",
    tour: "Uluwatu Full Day",
    hotel: "Ayodya",
    month: 0,
    year: 2026,
  },
  2: {
    guest: "Ayu",
    tour: "Ubud Tour",
    hotel: "Komaneka",
    month: 1,
    year: 2026,
  },
};

const summary = computed(() => summaries[activeDriver.value.id]);

/* ================= CALENDAR ================= */
const currentMonth = ref(summary.value.month);
const currentYear = ref(summary.value.year);

watch(activeDriver, () => {
  currentMonth.value = summary.value.month;
  currentYear.value = summary.value.year;
});

/* ================= TRIP DATA ================= */
const tripDaysByDriver = ref({
  1: {
    2026: {
      0: {
        1: { guest: "Nanda", destination: "Uluwatu" },
        2: { guest: "Nanda", destination: "GWK" },
        3: { guest: "Nanda", destination: "Jimbaran" },
      },
    },
  },
});

/* ================= MOBIL ================= */
const carByDriver = ref({
  1: "MOBIL A",
  2: "MOBIL B",
});

/* ================= DATE HELPERS ================= */
const daysInMonth = computed(() =>
  new Date(currentYear.value, currentMonth.value + 1, 0).getDate()
);

const days = computed(() =>
  Array.from({ length: daysInMonth.value }, (_, i) => i + 1)
);

const monthLabel = computed(() =>
  new Date(currentYear.value, currentMonth.value).toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  })
);

/* ================= MONTH NAV ================= */
const prevMonth = () => {
  if (currentMonth.value === 0) {
    currentMonth.value = 11;
    currentYear.value--;
  } else currentMonth.value--;
};

const nextMonth = () => {
  if (currentMonth.value === 11) {
    currentMonth.value = 0;
    currentYear.value++;
  } else currentMonth.value++;
};

/* ================= CORE ================= */
const dayData = (day) =>
  tripDaysByDriver.value?.[activeDriver.value.id]?.[currentYear.value]?.[
    currentMonth.value
  ]?.[day];

const isCrossed = (day) => !!dayData(day);

/* ================= TOGGLE ================= */
const toggleDay = (day) => {
  const d = activeDriver.value.id;
  const y = currentYear.value;
  const m = currentMonth.value;

  tripDaysByDriver.value[d] ??= {};
  tripDaysByDriver.value[d][y] ??= {};
  tripDaysByDriver.value[d][y][m] ??= {};

  if (tripDaysByDriver.value[d][y][m][day]) {
    delete tripDaysByDriver.value[d][y][m][day];
  } else {
    tripDaysByDriver.value[d][y][m][day] = {
      guest: summary.value.guest,
      destination: "",
    };
  }
};

/* ================= RESERVATION FORM ================= */
const crossedDays = computed(() => {
  const data =
    tripDaysByDriver.value?.[activeDriver.value.id]?.[currentYear.value]?.[
      currentMonth.value
    ] || {};

  return Object.keys(data)
    .map(Number)
    .sort((a, b) => a - b)
    .map((day) => ({
      day,
      ...data[day],
    }));
});

/* ================= DRIVER VIEW ================= */
const driverTimeline = computed(() =>
  crossedDays.value.map((d) => `Tgl ${d.day} → ${d.destination || "-"}`)
);
</script>

<template>
  <div class="space-y-8">
    <!-- ================= HEADER ================= -->
    <header
      class="flex items-center justify-between bg-white rounded-2xl px-6 py-4 shadow-sm border"
    >
      <div>
        <h1 class="text-xl font-semibold text-gray-900">Driver Heatmap</h1>
        <p class="text-sm text-gray-500">Driver schedule & trip overview</p>
      </div>

      <!-- ROLE SWITCH -->
      <div class="flex rounded-xl bg-gray-100 p-1">
        <button
          @click="role = 'driver'"
          class="px-4 py-2 text-sm font-medium rounded-lg transition"
          :class="
            role === 'driver'
              ? 'bg-white shadow text-emerald-600'
              : 'text-gray-500'
          "
        >
          Driver
        </button>
        <button
          @click="role = 'reservation'"
          class="px-4 py-2 text-sm font-medium rounded-lg transition"
          :class="
            role === 'reservation'
              ? 'bg-white shadow text-emerald-600'
              : 'text-gray-500'
          "
        >
          Reservation
        </button>
      </div>
    </header>

    <!-- ================= DRIVER VIEW ================= -->
    <section v-if="role === 'driver'" class="grid grid-cols-12 gap-6">
      <!-- IDENTITAS -->
      <div class="col-span-4 bg-white rounded-2xl border shadow-sm p-6">
        <h3 class="text-sm font-semibold text-gray-700 mb-4">
          Driver Information
        </h3>

        <div class="space-y-2 text-sm">
          <p>
            <span class="text-gray-500">Name</span><br />{{ activeDriver.name }}
          </p>
          <p>
            <span class="text-gray-500">Phone</span><br />{{
              activeDriver.phone
            }}
          </p>
          <p>
            <span class="text-gray-500">Vehicle</span><br />
            {{ carByDriver[activeDriver.id] || "-" }}
          </p>
        </div>
      </div>

      <!-- SUMMARY -->
      <div class="col-span-4 bg-white rounded-2xl border shadow-sm p-6">
        <h3 class="text-sm font-semibold text-gray-700 mb-4">Tour Summary</h3>

        <div class="space-y-2 text-sm">
          <p>
            <span class="text-gray-500">Guest</span><br />{{ summary.guest }}
          </p>
          <p><span class="text-gray-500">Tour</span><br />{{ summary.tour }}</p>
          <p>
            <span class="text-gray-500">Hotel</span><br />{{ summary.hotel }}
          </p>
        </div>

        <p class="mt-4 text-xs text-gray-400">{{ monthLabel }}</p>
      </div>

      <!-- TIMELINE -->
      <div class="col-span-12 bg-white rounded-2xl border shadow-sm p-6">
        <h3 class="text-sm font-semibold text-gray-700 mb-4">
          Daily Route Timeline
        </h3>

        <ul class="space-y-3">
          <li
            v-for="(t, i) in driverTimeline"
            :key="i"
            class="relative pl-6 text-sm text-gray-700"
          >
            <span
              class="absolute left-0 top-1 w-3 h-3 rounded-full bg-emerald-500"
            />
            {{ t }}
          </li>
        </ul>
      </div>
    </section>

    <!-- ================= RESERVATION VIEW ================= -->
    <section v-else class="grid grid-cols-12 gap-6">
      <!-- DRIVER LIST -->
      <aside class="col-span-2 bg-white rounded-2xl border shadow-sm p-4">
        <h4 class="text-xs font-semibold text-gray-500 mb-3 uppercase">
          Drivers
        </h4>

        <ul class="space-y-1">
          <li
            v-for="d in drivers"
            :key="d.id"
            @click="activeDriver = d"
            class="cursor-pointer px-3 py-2 rounded-lg text-sm transition"
            :class="
              activeDriver.id === d.id
                ? 'bg-emerald-50 text-emerald-700 font-medium'
                : 'hover:bg-gray-100 text-gray-600'
            "
          >
            {{ d.name }}
          </li>
        </ul>
      </aside>

      <!-- CALENDAR -->
      <section class="col-span-5 bg-white rounded-2xl border shadow-sm p-6">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-sm font-semibold text-gray-800">
              {{ activeDriver.name }}
            </h3>
            <p class="text-xs text-gray-500">{{ monthLabel }}</p>
          </div>

          <div class="flex gap-1">
            <button
              @click="prevMonth"
              class="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200"
            >
              ‹
            </button>
            <button
              @click="nextMonth"
              class="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200"
            >
              ›
            </button>
          </div>
        </div>

        <div class="grid grid-cols-7 gap-2">
          <div
            v-for="day in days"
            :key="day"
            @click="toggleDay(day)"
            class="relative h-11 rounded-xl flex items-center justify-center cursor-pointer text-sm transition"
            :class="
              isCrossed(day)
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            "
          >
            {{ day }}
            <span
              v-if="isCrossed(day)"
              class="absolute w-full h-[2px] bg-white rotate-[-45deg]"
            />
          </div>
        </div>
      </section>

      <!-- FORM -->
      <aside class="col-span-5 bg-white rounded-2xl border shadow-sm p-6">
        <h3 class="text-sm font-semibold text-gray-800 mb-4">Trip Details</h3>

        <!-- VEHICLE -->
        <div class="mb-5">
          <label class="text-xs text-gray-500 font-medium">Vehicle</label>
          <input
            v-model="carByDriver[activeDriver.id]"
            placeholder="DK 1234 AB"
            class="mt-1 w-full rounded-xl border-gray-300 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
          />
        </div>

        <!-- PER DAY -->
        <div v-for="d in crossedDays" :key="d.day" class="mb-4">
          <label class="text-xs text-gray-500 font-medium">
            Day {{ d.day }} – Destination
          </label>
          <input
            v-model="d.destination"
            @input="
              tripDaysByDriver[activeDriver.id][currentYear][currentMonth][
                d.day
              ].destination = d.destination
            "
            placeholder="e.g. Uluwatu"
            class="mt-1 w-full rounded-xl border-gray-300 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
          />
        </div>
      </aside>
    </section>
  </div>
</template>
