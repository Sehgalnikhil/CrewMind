import { Suspense, lazy } from "react";
import type { ComponentType, ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { SignIn, SignUp } from "@clerk/react";

import { RequireAuth } from "#/components/RequireAuth";
import { PermissionRoute } from "#/components/auth/PermissionRoute";
import { OrbitalLoader } from "#/components/os/ui";
import { PermissionProvider } from "#/core/permissions/PermissionProvider";
import { ROUTE_PERMISSIONS } from "#/core/permissions/permissions";
import { LandingPage } from "#/routes/LandingPage";

/* Each workspace is its own chunk — the OS boots fast and streams the rest. */
function lazyPage<K extends string>(loader: () => Promise<Record<K, ComponentType>>, name: K) {
  return lazy(async () => ({ default: (await loader())[name] }));
}

const DashboardPage = lazyPage(() => import("#/routes/DashboardPage"), "DashboardPage");
const WarRoomPage = lazyPage(() => import("#/routes/WarRoomPage"), "WarRoomPage");
const FeedPage = lazyPage(() => import("#/routes/FeedPage"), "FeedPage");
const TimelinePage = lazyPage(() => import("#/routes/TimelinePage"), "TimelinePage");
const DigitalTwinPage = lazyPage(() => import("#/routes/DigitalTwinPage"), "DigitalTwinPage");
const MemoryPage = lazyPage(() => import("#/routes/MemoryPage"), "MemoryPage");
const SimulatorPage = lazyPage(() => import("#/routes/SimulatorPage"), "SimulatorPage");
const BrainPage = lazyPage(() => import("#/routes/BrainPage"), "BrainPage");
const WikiPage = lazyPage(() => import("#/routes/WikiPage"), "default");

const AgentPanelPage = lazyPage(() => import("#/routes/AgentPanelPage"), "AgentPanelPage");
const AgentDetailPage = lazyPage(() => import("#/routes/AgentDetailPage"), "AgentDetailPage");
const ChatPage = lazyPage(() => import("#/routes/ChatPage"), "ChatPage");
const DocumentsPage = lazyPage(() => import("#/routes/DocumentsPage"), "DocumentsPage");
const ReportsPage = lazyPage(() => import("#/routes/ReportsPage"), "ReportsPage");
const NotificationsPage = lazyPage(() => import("#/routes/NotificationsPage"), "NotificationsPage");
const OrganizationPage = lazyPage(() => import("#/routes/OrganizationPage"), "OrganizationPage");
const BillingPage = lazyPage(() => import("#/routes/BillingPage"), "BillingPage");
const AdminPage = lazyPage(() => import("#/routes/AdminPage"), "AdminPage");
const ProfilePage = lazyPage(() => import("#/routes/ProfilePage"), "ProfilePage");
const SettingsPage = lazyPage(() => import("#/routes/SettingsPage"), "SettingsPage");

function guard(node: ReactNode, route?: string) {
  const permission = route ? ROUTE_PERMISSIONS[route] : undefined;
  return (
    <RequireAuth>
      <PermissionProvider>
        <PermissionRoute permission={permission}>
          <Suspense
            fallback={
              <div className="world flex h-screen items-center justify-center bg-[#05060C]">
                <OrbitalLoader label="loading workspace" />
              </div>
            }
          >
            {node}
          </Suspense>
        </PermissionRoute>
      </PermissionProvider>
    </RequireAuth>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login/*" element={<div className="world flex h-screen items-center justify-center bg-[#05060C]"><SignIn routing="path" path="/login" /></div>} />
      <Route path="/register/*" element={<div className="world flex h-screen items-center justify-center bg-[#05060C]"><SignUp routing="path" path="/register" /></div>} />

      <Route path="/dashboard" element={guard(<DashboardPage />)} />

      <Route path="/war-room" element={guard(<WarRoomPage />, "/war-room")} />
      <Route path="/feed" element={guard(<FeedPage />)} />
      <Route path="/timeline" element={guard(<TimelinePage />)} />

      <Route path="/twin" element={guard(<DigitalTwinPage />)} />
      <Route path="/memory" element={guard(<MemoryPage />)} />
      <Route path="/simulator" element={guard(<SimulatorPage />, "/simulator")} />
      <Route path="/brain" element={guard(<BrainPage />)} />
      <Route path="/wiki" element={guard(<WikiPage />)} />

      <Route path="/agents" element={guard(<AgentPanelPage />)} />
      <Route path="/agents/:key" element={guard(<AgentDetailPage />)} />
      <Route path="/chat" element={guard(<ChatPage />)} />
      <Route path="/documents" element={guard(<DocumentsPage />)} />
      <Route path="/reports" element={guard(<ReportsPage />)} />

      <Route path="/notifications" element={guard(<NotificationsPage />)} />
      <Route path="/organization" element={guard(<OrganizationPage />, "/organization")} />
      <Route path="/billing" element={guard(<BillingPage />, "/billing")} />
      <Route path="/admin" element={guard(<AdminPage />, "/admin")} />
      <Route path="/profile" element={guard(<ProfilePage />)} />
      <Route path="/settings" element={guard(<SettingsPage />, "/settings")} />

      <Route path="/" element={<LandingPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
