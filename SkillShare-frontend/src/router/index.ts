import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from "vue-router";
import MainLayout from "../layouts/MainLayout.vue";
import Home from "../pages/Home.vue";
import Categories from "../pages/Categories.vue";
import AddAnnouncementPage from "@/pages/AddAnnouncementPage.vue";
import Profile from "@/pages/Profile.vue";
import AnnouncementDetails from "@/pages/AnnouncementDetails.vue";
import EditAnnouncement from "@/pages/EditAnnouncement.vue";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    component: MainLayout,
    children: [
      { path: "/", name: "Home", component: Home },
      { path: "/Categories", name: "Categories", component: Categories },
      {
        path: "/add-announcement",
        name: "AddAnnouncement",
        component: AddAnnouncementPage,
      },
      { path: "/Profile", name: "Profile", component: Profile },
      {
        path: "/announcement/:id",
        name: "announcement-details",
        component: AnnouncementDetails,
      },
      {
        path: "/announcement/edit/:id",
        name: "announcement-edit",
        component: EditAnnouncement,
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
