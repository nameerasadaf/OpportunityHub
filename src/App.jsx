import React, { useState } from "react";
import "./App.css";

import AIAssistant from "./AIAssistant.jsx";
import Toast from "./components/common/Toast.jsx";
import MobileNav from "./components/layout/MobileNav.jsx";
import Sidebar from "./components/layout/Sidebar.jsx";
import TopNav from "./components/layout/TopNav.jsx";
import AddOpportunityModal from "./components/modals/AddOpportunityModal.jsx";
import EventModal from "./components/modals/EventModal.jsx";
import OpportunityDetailModal from "./components/modals/OpportunityDetailModal.jsx";
import { OpportunityProvider, useOpportunity } from "./context/OpportunityContext.jsx";
import AnalysisPage from "./pages/AnalysisPage.jsx";
import CalendarPage from "./pages/CalendarPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import ExplorePage from "./pages/ExplorePage.jsx";
import NotificationsPage from "./pages/NotificationsPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import TrackingPage from "./pages/TrackingPage.jsx";

function AppContent() {
  const { activePage, opportunities } = useOpportunity();

  // Mobile menu drawer state
  const [mobileOpen, setMobileOpen] = useState(false);

  // Add / Edit Opportunity Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState(null);

  // Opportunity Detail Modal state
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailOpportunityId, setDetailOpportunityId] = useState(null);

  // Calendar Event Modal state
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [eventInitialDate, setEventInitialDate] = useState("");
  const [editingEvent, setEditingEvent] = useState(null);

  // AI Assistant drawer/modal state
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);

  function handleOpenAddModal() {
    setEditingOpportunity(null);
    setIsAddModalOpen(true);
  }

  function handleEditOpportunity(opp) {
    setEditingOpportunity(opp);
    setIsAddModalOpen(true);
  }

  function handleOpenDetailModal(oppId) {
    setDetailOpportunityId(oppId);
    setIsDetailModalOpen(true);
  }

  function handleOpenEventModal(date = "", eventObj = null) {
    setEventInitialDate(date);
    setEditingEvent(eventObj);
    setIsEventModalOpen(true);
  }

  return (
    <div className="app-shell">
      {/* Sidebar Navigation */}
      <Sidebar
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div className="app-main">
        {/* Top Navigation */}
        <TopNav
          onToggleMobile={() => setMobileOpen((prev) => !prev)}
          onOpenAddModal={handleOpenAddModal}
          onToggleAiAssistant={() => setAiAssistantOpen((prev) => !prev)}
          aiAssistantOpen={aiAssistantOpen}
        />

        {/* AI Assistant Drawer / Banner when active */}
        {aiAssistantOpen && (
          <div style={{ padding: "0 32px", marginTop: "16px" }}>
            <div style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => setAiAssistantOpen(false)}
                style={{
                  position: "absolute",
                  top: "12px",
                  right: "16px",
                  color: "#cbd5e1",
                  fontSize: "18px",
                  cursor: "pointer",
                  zIndex: 10,
                }}
                aria-label="Close AI Assistant"
              >
                ✕
              </button>
              <AIAssistant opportunities={opportunities} />
            </div>
          </div>
        )}

        {/* Page Switcher */}
        <main>
          {activePage === "dashboard" && (
            <DashboardPage
              onOpenAddModal={handleOpenAddModal}
              onOpenDetailModal={handleOpenDetailModal}
              onOpenAiAssistant={() => setAiAssistantOpen(true)}
            />
          )}

          {activePage === "explore" && (
            <ExplorePage
              onOpenDetailModal={handleOpenDetailModal}
            />
          )}

          {activePage === "tracking" && (
            <TrackingPage
              onOpenAddModal={handleOpenAddModal}
              onOpenDetailModal={handleOpenDetailModal}
              onEditOpportunity={handleEditOpportunity}
            />
          )}

          {activePage === "analysis" && (
            <AnalysisPage />
          )}

          {activePage === "calendar" && (
            <CalendarPage
              onOpenEventModal={handleOpenEventModal}
              onOpenDetailModal={handleOpenDetailModal}
            />
          )}

          {activePage === "notifications" && (
            <NotificationsPage
              onOpenDetailModal={handleOpenDetailModal}
            />
          )}

          {activePage === "settings" && (
            <SettingsPage />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileNav />

      {/* Modals & Feedback Overlays */}
      <AddOpportunityModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        editingOpportunity={editingOpportunity}
      />

      <OpportunityDetailModal
        isOpen={isDetailModalOpen}
        opportunityId={detailOpportunityId}
        onClose={() => setIsDetailModalOpen(false)}
        onEdit={(opp) => {
          setIsDetailModalOpen(false);
          handleEditOpportunity(opp);
        }}
      />

      <EventModal
        isOpen={isEventModalOpen}
        initialDate={eventInitialDate}
        editingEvent={editingEvent}
        onClose={() => setIsEventModalOpen(false)}
      />

      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <OpportunityProvider>
      <AppContent />
    </OpportunityProvider>
  );
}