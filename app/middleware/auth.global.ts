import { isPublicPath } from '~/lib/publicPaths'

export default defineNuxtRouteMiddleware(async (to) => {
  const { signedIn, ready } = useAuth()
  await ready()
  const failed = Boolean(to.query.error) || window.location.hash.includes('error=')
  if (!signedIn.value && failed && to.path !== '/login') return navigateTo({ path: '/login', query: { error: 'not-allowed' } })
  if (!signedIn.value && !isPublicPath(to.path)) return navigateTo('/login')
  if (signedIn.value && to.path === '/login') return navigateTo('/')
})
