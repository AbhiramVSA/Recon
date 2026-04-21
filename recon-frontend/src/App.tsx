import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import Layout from './components/Layout';
import Home from './components/Home';
import Events from './components/Events';
import Schedule from './components/Schedule';
import Team from './components/Team';
import Prizes from './components/Prizes';
import Sponsors from './components/Sponsors';
import FAQ from './components/FAQ';
import Contact from './components/Contact';
import Preloader from './components/Preloader';
import PortalLayout from './portal/components/PortalLayout';
import { RedirectIfVerified, RequireParticipantProfile, RequireVerified } from './portal/components/RouteGuards';
import LoginPage from './portal/pages/LoginPage';
import VerifyPage from './portal/pages/VerifyPage';
import AuthCallbackPage from './portal/pages/AuthCallbackPage';
import DashboardPage from './portal/pages/DashboardPage';
import ZonesPage from './portal/pages/ZonesPage';
import ZoneDetailPage from './portal/pages/ZoneDetailPage';
import MapPage from './portal/pages/MapPage';
import MerchPage from './portal/pages/MerchPage';
import AnnouncementsPage from './portal/pages/AnnouncementsPage';
import ProfileSetupPage from './portal/pages/ProfileSetupPage';
import SettingsPage from './portal/pages/SettingsPage';
import { RequireAdmin } from './portal/components/RequireAdmin';
import AdminHomePage from './portal/pages/admin/AdminHomePage';
import AdminUsersPage from './portal/pages/admin/AdminUsersPage';
import AdminIncidentsPage from './portal/pages/admin/AdminIncidentsPage';
import AdminParticipantsPage from './portal/pages/admin/AdminParticipantsPage';
import AdminSchedulePage from './portal/pages/admin/AdminSchedulePage';
import AdminPartnersPage from './portal/pages/admin/AdminPartnersPage';
import AdminStoragePage from './portal/pages/admin/AdminStoragePage';
import AdminApiCoveragePage from './portal/pages/admin/AdminApiCoveragePage';
import AdminTeamsPage from './portal/pages/admin/AdminTeamsPage';
import AdminZoneScannerPage from './portal/pages/admin/AdminZoneScannerPage';
import AdminAnnouncementsPage from './portal/pages/admin/AdminAnnouncementsPage';
import AdminShopPage from './portal/pages/admin/AdminShopPage';
import AdminPointsPage from './portal/pages/admin/AdminPointsPage';
import { useAuthStore } from './portal/stores/authStore';
import HuntHomePage from './portal/pages/hunt/HuntHomePage';
import HuntTeamPage from './portal/pages/hunt/HuntTeamPage';
import HuntScanPage from './portal/pages/hunt/HuntScanPage';
import HuntProblemPage from './portal/pages/hunt/HuntProblemPage';
import HuntProgressPage from './portal/pages/hunt/HuntProgressPage';
import HuntLeaderboardPage from './portal/pages/hunt/HuntLeaderboardPage';
import HuntDisplayPage from './portal/pages/hunt/HuntDisplayPage';
import PwaInstallPrompt from './pwa/PwaInstallPrompt';
import { isPortalPath } from './pwa/routes';

function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }, [pathname]);

    return null;
}

function AppEnvironment() {
    const { pathname } = useLocation();
    const portalPath = isPortalPath(pathname);

    useEffect(() => {
        if (portalPath) {
            document.body.dataset.portal = 'true';
        } else {
            delete document.body.dataset.portal;
        }

        return () => {
            delete document.body.dataset.portal;
        };
    }, [portalPath]);

    return <PwaInstallPrompt portalRoute={portalPath} />;
}

function ConditionalPreloader() {
    const { pathname } = useLocation();
    const portalPath = isPortalPath(pathname);

    if (portalPath) return null;
    return <Preloader />;
}

export default function App() {
    const bootstrapSession = useAuthStore((state) => state.bootstrapSession);
    const bootstrappedRef = useRef(false);

    useEffect(() => {
        if (bootstrappedRef.current) return;
        bootstrappedRef.current = true;
        void bootstrapSession();
    }, [bootstrapSession]);

    return (
        <BrowserRouter>
            <ConditionalPreloader />
            <ScrollToTop />
            <AppEnvironment />
            <Routes>
                <Route element={<RedirectIfVerified />}>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/verify" element={<VerifyPage />} />
                    <Route path="/auth/callback" element={<AuthCallbackPage />} />
                </Route>

                <Route element={<RequireVerified />}>
                    <Route element={<PortalLayout />}>
                        <Route path="/profile/setup" element={<ProfileSetupPage />} />
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/zones" element={<ZonesPage />} />
                        <Route path="/zones/:id" element={<ZoneDetailPage />} />
                        <Route path="/map" element={<MapPage />} />
                        <Route path="/merch" element={<MerchPage />} />
                        <Route path="/announcements" element={<AnnouncementsPage />} />
                        <Route path="/settings" element={<SettingsPage />} />
                        <Route element={<RequireParticipantProfile />}>
                            <Route path="/hunt" element={<HuntHomePage />} />
                            <Route path="/hunt/team" element={<HuntTeamPage />} />
                            <Route path="/hunt/scan" element={<HuntScanPage />} />
                            <Route path="/hunt/r/:routeHash" element={<HuntProblemPage />} />
                            <Route path="/hunt/problem/:problemId" element={<HuntProblemPage />} />
                            <Route path="/hunt/progress" element={<HuntProgressPage />} />
                            <Route path="/hunt/leaderboard" element={<HuntLeaderboardPage />} />
                            <Route path="/hunt/display" element={<HuntDisplayPage />} />
                        </Route>
                        <Route element={<RequireAdmin />}>
                            <Route path="/admin" element={<AdminHomePage />} />
                            <Route path="/admin/users" element={<AdminUsersPage />} />
                            <Route path="/admin/incidents" element={<AdminIncidentsPage />} />
                            <Route path="/admin/participants" element={<AdminParticipantsPage />} />
                            <Route path="/admin/zone-scanner" element={<AdminZoneScannerPage />} />
                            <Route path="/admin/teams" element={<AdminTeamsPage />} />
                            <Route path="/admin/announcements" element={<AdminAnnouncementsPage />} />
                            <Route path="/admin/shop" element={<AdminShopPage />} />
                            <Route path="/admin/points" element={<AdminPointsPage />} />
                            <Route path="/admin/schedule" element={<AdminSchedulePage />} />
                            <Route path="/admin/partners" element={<AdminPartnersPage />} />
                            <Route path="/admin/storage" element={<AdminStoragePage />} />
                            <Route path="/admin/api-coverage" element={<AdminApiCoveragePage />} />
                        </Route>
                    </Route>
                </Route>

                <Route element={<Layout />}>
                    <Route index element={<Home />} />
                    <Route path="/events" element={<Events />} />
                    <Route path="/schedule" element={<Schedule />} />
                    <Route path="/people" element={<Team />} />
                    <Route path="/prizes" element={<Prizes />} />
                    <Route path="/sponsors" element={<Sponsors />} />
                    <Route path="/faq" element={<FAQ />} />
                    <Route path="/contact" element={<Contact />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}
