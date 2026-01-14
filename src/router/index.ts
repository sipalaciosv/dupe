import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { RouteLocationNormalized } from 'vue-router'

// Lazy load views
const Login = () => import('@/views/Login.vue')
const Home = () => import('@/views/Home.vue')
const OriginalDetail = () => import('@/views/OriginalDetail.vue')
const DupeDetail = () => import('@/views/DupeDetail.vue')
const Expedition = () => import('@/views/Expedition.vue')
const NewItem = () => import('@/views/NewItem.vue')
const Profile = () => import('@/views/Profile.vue')
const PublicView = () => import('@/views/PublicView.vue')

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/login',
            name: 'login',
            component: Login,
            meta: { requiresAuth: false },
        },
        {
            path: '/',
            name: 'home',
            component: Home,
            meta: { requiresAuth: true },
        },
        {
            path: '/original/:id',
            name: 'original-detail',
            component: OriginalDetail,
            meta: { requiresAuth: true },
        },
        {
            path: '/dupe/:id',
            name: 'dupe-detail',
            component: DupeDetail,
            meta: { requiresAuth: true },
        },
        {
            path: '/expedition',
            name: 'expedition',
            component: Expedition,
            meta: { requiresAuth: true },
        },
        {
            path: '/new',
            name: 'new-item',
            component: NewItem,
            meta: { requiresAuth: true },
        },
        {
            path: '/profile',
            name: 'profile',
            component: Profile,
            meta: { requiresAuth: true },
        },
        {
            path: '/public/:publicSlug',
            name: 'public-view',
            component: PublicView,
            meta: { requiresAuth: false, isPublic: true },
        },
    ],
})

// Navigation guard
router.beforeEach((to: RouteLocationNormalized, from: RouteLocationNormalized, next) => {
    const authStore = useAuthStore()
    const requiresAuth = to.meta.requiresAuth

    if (requiresAuth && !authStore.isAuthenticated) {
        next({ name: 'login' })
    } else if (to.name === 'login' && authStore.isAuthenticated) {
        next({ name: 'home' })
    } else {
        next()
    }
})

export default router
