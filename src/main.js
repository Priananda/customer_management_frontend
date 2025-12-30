import { createApp } from "vue";
import { createPinia } from "pinia";
import piniaPersist from "pinia-plugin-persistedstate";
import App from "./App.vue";
import router from "./router";
import "./style.css";


import favicon from "@/assets/images/bali-sundaram-logo.jpg";

const app = createApp(App);


const link = document.createElement("link");
link.rel = "icon";
link.type = "image/jpeg";
link.href = favicon;
document.head.appendChild(link);


const pinia = createPinia();
pinia.use(piniaPersist);

app.use(pinia);
app.use(router);
app.mount("#app");
