<script setup>
import { ref, watch, computed, onMounted } from "vue";
import api from "../api/api";
import { ArrowUp, ArrowDown, RotateCcw } from "lucide-vue-next";
import leftIcon from "../assets/images/undraw_annotation.png";

const props = defineProps({
  show: { type: Boolean, required: true },
});
const emit = defineEmits(["close"]);

const logs = ref([]);
const loading = ref(false);
const scrollContainer = ref(null);
const searchText = ref("");
const searchBy = ref("");
const searchDate = ref("");

const fetchLogs = async () => {
  loading.value = true;
  try {
    const res = await api.get("/activity-logs");
    logs.value =
      res.data?.status && Array.isArray(res.data.data) ? res.data.data : [];
  } catch (e) {
    console.error(e);
    logs.value = [];
  } finally {
    loading.value = false;
  }
};

const loadingDelete = ref(false);
const confirmDeleteLog = ref(null);
const deleteLog = async (id) => {
  loadingDelete.value = true;
  try {
    await api.post(`/activity-logs/${id}/delete`);
    logs.value = logs.value.filter((log) => log.id !== id);
    confirmDeleteLog.value = null;
  } catch (e) {
    console.error(e);
    alert("Failed to delete log");
    confirmDeleteLog.value = null;
  } finally {
    loadingDelete.value = false;
  }
};

watch(
  () => props.show,
  (v) => v && fetchLogs()
);

const close = () => emit("close");

const formatDate = (date) =>
  date ? new Date(date).toLocaleString("id-ID") : "-";

const formatDescription = (log) => {
  const model = log.log_name
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());

  const actionMap = {
    created: "dibuat",
    updated: "diperbarui",
    deleted: "dihapus",
  };

  const action = actionMap[log.event] ?? log.event;

  return `${model} ${action}`;
};

const eventBadge = (event) =>
  ({
    created: "bg-green-100 text-green-700 border-green-200",
    updated: "bg-blue-100 text-blue-700 border-blue-200",
    deleted: "bg-red-100 text-red-700 border-red-200",
  }[event] || "bg-slate-100 text-slate-600 border-slate-200");

const formatFileName = (fileName) => {
  if (!fileName) return "-";
  const name = fileName.split("/").pop();
  return name.replace(/\s\(\d+\)/, "");
};

const formatChanges = (log) => {
  const oldData = log.properties?.old || {};
  const newData = log.properties?.attributes || {};

  return Object.keys(newData)
    .filter((key) => {
      const oldVal = oldData[key];
      const newVal = newData[key];
      if (Array.isArray(oldVal) || Array.isArray(newVal)) return true;
      return oldVal !== newVal;
    })
    .map((key) => {
      let from = oldData[key] ?? "-";
      let to = newData[key] ?? "-";

      if (Array.isArray(from)) {
        from = from
          .map((f) => (f?.file_name ? formatFileName(f.file_name) : "-"))
          .join(", ");
      }
      if (Array.isArray(to)) {
        to = to
          .map((f) => (f?.file_name ? formatFileName(f.file_name) : "-"))
          .join(", ");
      }

      if (!Array.isArray(from)) from = String(from);
      if (!Array.isArray(to)) to = String(to);

      return {
        field: key.replace(/_/g, " "),
        from,
        to,
      };
    });
};

const filteredLogs = computed(() =>
  logs.value.filter((log) => {
    const desc = formatDescription(log).toLowerCase();
    const by = log.causer?.name?.toLowerCase() || "";
    const logDate = log.created_at ? log.created_at.split("T")[0] : "";

    return (
      (!searchText.value || desc.includes(searchText.value.toLowerCase())) &&
      (!searchBy.value || by.includes(searchBy.value.toLowerCase())) &&
      (!searchDate.value || logDate === searchDate.value)
    );
  })
);

const isRotating = ref(false);
const resetFilter = () => {
  isRotating.value = true;
  searchText.value = "";
  searchBy.value = "";
  searchDate.value = "";
  setTimeout(() => {
    isRotating.value = false;
  }, 600);
};

const scrollUp = () => {
  if (scrollContainer.value) {
    scrollContainer.value.scrollTo({ top: 0, behavior: "smooth" });
  }
};

const scrollDown = () => {
  if (scrollContainer.value) {
    scrollContainer.value.scrollTo({
      top: scrollContainer.value.scrollHeight,
      behavior: "smooth",
    });
  }
};
</script>

<template>
  <transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="opacity-0 scale-90"
    enter-to-class="opacity-100 scale-100"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="opacity-100 scale-100"
    leave-to-class="opacity-0 scale-90"
  >
    <div
      v-if="show"
      class="px-2 fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    >
      <div
        class="relative flex flex-col w-full max-w-4xl h-[90vh] bg-white rounded-2xl shadow-xl"
      >
        <div
          class="flex items-center justify-between px-6 py-4 border-b border-slate-200"
        >
          <img :src="leftIcon" alt="Icon" class="w-20 h-20" />

          <div class="flex-1 ml-4">
            <h2 class="text-lg font-semibold text-slate-800">Activity Log</h2>
            <p class="text-sm text-slate-600">System activity history</p>
          </div>

          <button
            @click="close"
            class="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors ml-2"
          >
            ✕
          </button>
        </div>

        <div class="px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              v-model="searchText"
              placeholder="Search for activities"
              class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none"
            />
            <input
              v-model="searchBy"
              placeholder="Search for user"
              class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none"
            />
            <input
              v-model="searchDate"
              type="date"
              class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none"
            />
            <button
              @click="resetFilter"
              class="px-4 py-2 text-white rounded-lg bg-linear-to-br from-indigo-700 to-blue-700 hover:from-indigo-600 hover:to-blue-600 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
            >
              <RotateCcw
                class="w-4 h-4 transition-transform"
                :class="{ 'rotate-animation': isRotating }"
              />
              <span class="text-center">Reset</span>
            </button>
          </div>
        </div>

        <div
          ref="scrollContainer"
          class="flex-1 overflow-y-auto px-6 py-4 hide-scrollbar relative"
        >
          <div v-if="loading" class="py-10 text-center text-slate-500">
            Loading log activity...
          </div>
          <div
            v-else-if="!filteredLogs.length"
            class="py-10 text-center text-slate-500"
          >
            No Activity Logs
          </div>

          <ul v-else class="space-y-3">
            <transition
              enter-active-class="transition-all duration-300 ease-[cubic-bezier(.16,1,.3,1)]"
              enter-from-class="opacity-0 scale-95"
              enter-to-class="opacity-100 scale-100"
              leave-active-class="transition-all duration-200 ease-in"
              leave-from-class="opacity-100 scale-100"
              leave-to-class="opacity-0 scale-95"
            >
              <div
                v-if="confirmDeleteLog"
                class="px-2 fixed inset-0 flex items-center justify-center bg-black/40 z-50"
              >
                <div class="bg-white rounded-lg p-6 w-96 shadow-lg text-center">
                  <p class="mb-4 text-gray-700">
                    Apakah Anda yakin ingin menghapus<br />
                    log ini?
                  </p>
                  <div class="flex justify-center gap-3">
                    <button
                      @click="deleteLog(confirmDeleteLog)"
                      :disabled="loadingDelete"
                      class="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2 justify-center"
                    >
                      <svg
                        v-if="loadingDelete"
                        class="w-4 h-4 animate-spin text-white"
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
                        />
                        <path
                          class="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                        />
                      </svg>
                      <span>{{ loadingDelete ? "Memproses..." : "Ya" }}</span>
                    </button>
                    <button
                      @click="confirmDeleteLog = null"
                      :disabled="loadingDelete"
                      class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Tidak
                    </button>
                  </div>
                </div>
              </div>
            </transition>

            <li
              v-for="log in filteredLogs"
              :key="log.id"
              class="rounded-lg border border-slate-200 bg-white px-4 py-3 hover:bg-slate-50"
            >
              <div class="flex items-start justify-between gap-4">
                <div class="flex flex-col gap-1">
                  <div class="flex items-center gap-2">
                    <p class="text-sm font-medium text-slate-800">
                      {{ formatDescription(log) }}
                    </p>
                    <span
                      class="h-fit rounded-full border px-3 py-0.5 text-xs capitalize"
                      :class="eventBadge(log.event)"
                    >
                      {{ log.event }}
                    </span>
                  </div>
                  <p class="mt-1 text-xs text-slate-500">
                    By
                    <span class="font-medium text-slate-700">{{
                      log.causer?.name ?? "System"
                    }}</span>
                    • {{ formatDate(log.created_at) }}
                  </p>
                </div>

                <button
                  @click="confirmDeleteLog = log.id"
                  class="h-fit rounded-md px-3 py-1 text-xs font-medium bg-red-100 text-red-700 border border-red-200 hover:bg-red-200 transition-colors"
                >
                  Delete
                </button>
              </div>

              <div
                v-if="formatChanges(log).length"
                class="mt-3 space-y-1 rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600"
              >
                <div
                  v-for="(c, i) in formatChanges(log)"
                  :key="i"
                  class="flex flex-wrap gap-1"
                >
                  <span class="font-medium capitalize text-slate-700">{{
                    c.field
                  }}</span
                  >:
                  <span
                    class="text-red-500 wrap-break-word max-w-full sm:max-w-none"
                    >{{ c.from }}</span
                  >
                  →
                  <span
                    class="text-green-600 wrap-break-word max-w-full sm:max-w-none"
                    >{{ c.to }}</span
                  >
                </div>
              </div>
            </li>
          </ul>
        </div>

        <div class="absolute bottom-4 right-1 flex flex-col gap-2">
          <button
            @click="scrollUp"
            class="p-2 rounded-full bg-slate-50 border border-slate-200 shadow hover:bg-slate-100"
          >
            <ArrowUp class="w-4 h-4 text-blue-700" />
          </button>
          <button
            @click="scrollDown"
            class="p-2 rounded-full bg-slate-50 border border-slate-200 shadow hover:bg-slate-100"
          >
            <ArrowDown class="w-4 h-4 text-blue-700" />
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.rotate-animation {
  animation: rotateClick 0.6s ease-in-out;
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
</style>
