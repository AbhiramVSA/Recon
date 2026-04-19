export function isPortalPath(pathname: string) {
    return (
        pathname.startsWith('/login')
        || pathname.startsWith('/verify')
        || pathname.startsWith('/auth/callback')
        || pathname.startsWith('/dashboard')
        || pathname.startsWith('/zones')
        || pathname.startsWith('/map')
        || pathname.startsWith('/merch')
        || pathname.startsWith('/announcements')
        || pathname.startsWith('/settings')
        || pathname.startsWith('/admin')
        || pathname.startsWith('/profile')
        || pathname.startsWith('/hunt')
    );
}
