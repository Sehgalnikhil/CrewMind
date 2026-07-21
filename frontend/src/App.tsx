import { Navigate, Route, Routes } from "react-router-dom";

import { RequireAuth } from "#/components/RequireAuth";
import { AgentPanelPage } from "#/routes/AgentPanelPage";
import { ChatPage } from "#/routes/ChatPage";
import { DashboardPage } from "#/routes/DashboardPage";
import { DocumentsPage } from "#/routes/DocumentsPage";
import { LoginPage } from "#/routes/LoginPage";
import { RegisterPage } from "#/routes/RegisterPage";
import { SettingsPage } from "#/routes/SettingsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <DashboardPage />
          </RequireAuth>
        }
      />
      <Route
        path="/agents"
        element={
          <RequireAuth>
            <AgentPanelPage />
          </RequireAuth>
        }
      />
      <Route
        path="/chat"
        element={
          <RequireAuth>
            <ChatPage />
          </RequireAuth>
        }
      />
      <Route
        path="/documents"
        element={
          <RequireAuth>
            <DocumentsPage />
          </RequireAuth>
        }
      />
      <Route
        path="/settings"
        element={
          <RequireAuth>
            <SettingsPage />
          </RequireAuth>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
