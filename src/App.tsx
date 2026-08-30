import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import MontessoriNexusLanding from "./pages/public/MontessoriNexusLanding";
import { PrivacyPolicyPage } from "./pages/public/PrivacyPolicyPage";
import { TermsOfServicePage } from "./pages/public/TermsOfServicePage";
import NotFound from "./pages/NotFound";
import SchoolNotFoundPage from "./pages/SchoolNotFoundPage";
import PageLoadingIndicator from "./components/ui/PageLoadingIndicator";
import AdminPage from "./pages/admin/AdminPage";
import DocumentosPage from "./pages/DocumentosPage";
import AplicativosPage from "./pages/AplicativosPage";
import { AdmissionPortalPage } from "./pages/public/AdmissionPortalPage";
import { PublicFormPage } from "./pages/public/PublicFormPage";
import { BlogIndexPage } from "./pages/public/BlogIndexPage";
import { BlogPostDetailPage } from "./pages/public/BlogPostDetailPage";
import { CTAWidget } from "@/components/CTAWidget";
import { FeedRealtimeNotificationBalloon } from "@/components/feed/FeedRealtimeNotificationBalloon";

import { SettingsProvider, useSiteSettings, checkIsPlatformRootSync } from "@/context/SettingsContext";
import { AuthProvider } from "@/context/AuthContext";
import { ConfirmDialogProvider } from "@/context/ConfirmDialogContext";

const queryClient = new QueryClient();

const DomainRoutes: React.FC = () => {
  const { isSchoolNotFound, unregisteredHost, isPlatformRoot, loading } = useSiteSettings();
  const location = useLocation();

  // Allow admin routes even on custom/unregistered domains so managers can log in or register
  const isAdminRoute =
    location.pathname.startsWith('/panel') ||
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/console');

  const isBlogHost = typeof window !== 'undefined' && (
    window.location.hostname === 'blog.montessorinexus.com' ||
    window.location.hostname === 'blog.localhost' ||
    window.location.hostname.startsWith('blog.')
  );

  // SaaS platform landing routes should render immediately without a loading indicator
  const isPlatformLanding =
    (isPlatformRoot || checkIsPlatformRootSync() || isBlogHost) &&
    (location.pathname === '/' ||
      location.pathname.startsWith('/blog') ||
      location.pathname === '/platform' ||
      location.pathname === '/nexus' ||
      location.pathname === '/privacidad' ||
      location.pathname === '/privacy' ||
      location.pathname === '/politica-privacidad' ||
      location.pathname === '/privacy-policy' ||
      location.pathname === '/terminos' ||
      location.pathname === '/terms' ||
      location.pathname === '/terminos-de-servicio' ||
      location.pathname === '/terms-of-service');

  // Prevent flash of unstyled colors on school pages until settings & host are resolved
  if (loading && !isAdminRoute && !isPlatformLanding) {
    return <PageLoadingIndicator />;
  }

  if (isSchoolNotFound && !isAdminRoute) {
    return <SchoolNotFoundPage attemptedHost={unregisteredHost} />;
  }

  return (
    <>
      <FeedRealtimeNotificationBalloon />
      {!isPlatformRoot && !isBlogHost && <CTAWidget />}
      <Routes>
        {isBlogHost ? (
          <>
            <Route path="/" element={<BlogIndexPage />} />
            <Route path="/:slug" element={<BlogPostDetailPage />} />
            <Route path="/blog" element={<BlogIndexPage />} />
            <Route path="/blog/:slug" element={<BlogPostDetailPage />} />
          </>
        ) : (
          <Route path="/" element={isPlatformRoot ? <MontessoriNexusLanding /> : <Index />} />
        )}
        <Route path="/blog" element={<BlogIndexPage />} />
        <Route path="/blog/:slug" element={<BlogPostDetailPage />} />
        <Route path="/colegio/:schoolSlug/blog" element={<BlogIndexPage />} />
        <Route path="/colegio/:schoolSlug/blog/:slug" element={<BlogPostDetailPage />} />
        <Route path="/school/:schoolSlug/blog" element={<BlogIndexPage />} />
        <Route path="/school/:schoolSlug/blog/:slug" element={<BlogPostDetailPage />} />
        <Route path="/platform" element={<MontessoriNexusLanding />} />
        <Route path="/nexus" element={<MontessoriNexusLanding />} />
        <Route path="/privacidad" element={<PrivacyPolicyPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/politica-privacidad" element={<PrivacyPolicyPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/terminos" element={<TermsOfServicePage />} />
        <Route path="/terms" element={<TermsOfServicePage />} />
        <Route path="/terminos-de-servicio" element={<TermsOfServicePage />} />
        <Route path="/terms-of-service" element={<TermsOfServicePage />} />
        {/* Explicit Demo Path Redirects */}
        <Route path="/demo" element={<Navigate to="/" replace />} />
        <Route path="/demo/*" element={<Navigate to="/" replace />} />
        <Route path="/colegio/ceiba" element={<Navigate to="/" replace />} />
        <Route path="/colegio/ceiba/*" element={<Navigate to="/" replace />} />
        <Route path="/school/ceiba" element={<Navigate to="/" replace />} />
        <Route path="/school/ceiba/*" element={<Navigate to="/" replace />} />

        <Route path="/colegio/:slug" element={<Index />} />
        <Route path="/school/:slug" element={<Index />} />
        <Route path="/panel" element={<AdminPage />} />
        <Route path="/panel/*" element={<AdminPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/*" element={<AdminPage />} />
        <Route path="/console" element={<AdminPage />} />
        <Route path="/console/*" element={<AdminPage />} />
        <Route path="/pricing" element={<AdminPage />} />
        <Route path="/suscripcion" element={<AdminPage />} />
        <Route path="/admision/:token" element={<AdmissionPortalPage />} />
        <Route path="/admision/:token/:formId" element={<AdmissionPortalPage />} />
        <Route path="/admision/expediente/:token" element={<AdmissionPortalPage />} />
        <Route path="/admision/expediente/:token/:formId" element={<AdmissionPortalPage />} />
        <Route path="/admissions/portal/:token" element={<AdmissionPortalPage />} />
        <Route path="/admissions/portal/:token/:formId" element={<AdmissionPortalPage />} />
        <Route path="/forms/:id" element={<PublicFormPage />} />
        <Route path="/f/:id" element={<PublicFormPage />} />
        <Route path="/formulario/:id" element={<PublicFormPage />} />
        <Route path="/documentos" element={<DocumentosPage />} />
        <Route path="/documents" element={<DocumentosPage />} />
        <Route path="/aplicativos" element={<AplicativosPage />} />
        <Route path="/applications" element={<AplicativosPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <SettingsProvider>
          <ConfirmDialogProvider>
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <DomainRoutes />
            </BrowserRouter>
          </ConfirmDialogProvider>
        </SettingsProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
