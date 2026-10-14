// Pages anyone can open without signing in. They are shown without the app navigation.
export const PUBLIC_PATHS = ['/login', '/privacy']
export const isPublicPath = (path: string) => PUBLIC_PATHS.includes(path)
