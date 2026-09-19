import React, { useState } from 'react';
import { RoleProvider } from './context/RoleContext';
import { AuthProvider } from './context/AuthContext';
import OpeningSplashIntro from './components/landing/OpeningSplashIntro';
import IntroLandingView from './components/landing/IntroLandingView';
import Sidebar from './components/layout/Sidebar';
import DashboardTopBar from './components/layout/DashboardTopBar';
import { AddCustomerModal } from './components/customers/AddCustomerModal';
import { PrivacySettingsModal } from './components/settings/PrivacySettingsModal';
import { AuthModal } from './components/auth/AuthModal';
import GuidedTourModal from './components/GuidedTourModal';

import DiscoveryTab from './components/tabs/DiscoveryTab';
import BatchTab from './components/tabs/BatchTab';
import CustomersTab from './components/tabs/CustomersTab';
import CampaignTab from './components/tabs/CampaignTab';
import WebhookTab from './components/tabs/WebhookTab';
import RevealTab from './components/tabs/RevealTab';
import GovernanceTab from './components/tabs/GovernanceTab';

export default function App() {
  // Splash screen on initial open: 'DATA. CONVERT. SECURE.'
  const [showSplash, setShowSplash] = useState(true);
  
  // 'landing' for Animated Intro View, 'console' for Minimalist Sidebar Dashboard
  const [viewMode, setViewMode] = useState('landing');
  const [activeTab, setActiveTab] = useState('discovery');
  const [tourOpen, setTourOpen] = useState(false);
  const [addCustomerOpen, setAddCustomerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [customerRefreshKey, setCustomerRefreshKey] = useState(0);

  const handleNavigateToTab = (tabId) => {
    setActiveTab(tabId);
    setViewMode('console');
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'discovery':
        return <DiscoveryTab onOpenAddCustomer={() => setAddCustomerOpen(true)} />;
      case 'batch':
        return <BatchTab />;
      case 'customers':
        return (
          <CustomersTab
            refreshKey={customerRefreshKey}
            onOpenAddCustomer={() => setAddCustomerOpen(true)}
          />
        );
      case 'campaign':
        return (
          <CampaignTab
            refreshKey={customerRefreshKey}
            onOpenAddCustomer={() => setAddCustomerOpen(true)}
          />
        );
      case 'webhook':

        return <WebhookTab />;
      case 'reveal':
        return <RevealTab />;
      case 'governance':
        return <GovernanceTab />;
      default:
        return <DiscoveryTab onOpenAddCustomer={() => setAddCustomerOpen(true)} />;
    }
  };


  return (
    <AuthProvider>
      <RoleProvider>
        <div className="min-h-screen bg-[#eaf0fa] text-slate-900 selection:bg-indigo-500 selection:text-white font-sans antialiased relative">
          
          {/* 0. CINEMATIC OPENING SPLASH: DATA. CONVERT. SECURE. */}
          {showSplash && (
            <OpeningSplashIntro onComplete={() => setShowSplash(false)} />
          )}

          {/* 1. ANIMATED INTRO / LANDING VIEW */}
          {viewMode === 'landing' ? (
            <IntroLandingView
              onLaunchConsole={() => setViewMode('console')}
              onOpenTour={() => setTourOpen(true)}
              onNavigateTab={handleNavigateToTab}
              onReplaySplash={() => setShowSplash(true)}
            />
          ) : (
            /* 2. MINIMALIST SIDEBAR DASHBOARD */
            <div className="flex min-h-screen bg-[#eaf0fa]">
              {/* Left-Hand Fixed Sidebar */}
              <Sidebar
                activeTab={activeTab}
                onSelectTab={setActiveTab}
                onReturnToIntro={() => setViewMode('landing')}
                onOpenTour={() => setTourOpen(true)}
                onOpenSettings={() => setSettingsOpen(true)}
                onOpenAddCustomer={() => setAddCustomerOpen(true)}
              />

              {/* Main Content Area */}
              <div className="flex-1 flex flex-col min-w-0 bg-[#eaf0fa]">
                {/* Modern Top Bar */}
                <DashboardTopBar
                  activeTab={activeTab}
                  onReturnToIntro={() => setViewMode('landing')}
                  onOpenAddCustomer={() => setAddCustomerOpen(true)}
                  onOpenSettings={() => setSettingsOpen(true)}
                  onOpenAuth={() => setAuthModalOpen(true)}
                />

                {/* Main Content Canvas */}
                <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
                  {renderActiveView()}
                </main>
              </div>
            </div>
          )}

          {/* 13-Point Guided Evaluation Tour Modal */}
          <GuidedTourModal
            isOpen={tourOpen}
            onClose={() => setTourOpen(false)}
            onSelectTab={(tabId) => {
              setActiveTab(tabId);
              setViewMode('console');
            }}
          />

          {/* Add Customer & Live Ingestion Modal */}
          <AddCustomerModal
            isOpen={addCustomerOpen}
            onClose={() => setAddCustomerOpen(false)}
            onCustomerCreated={() => {
              setCustomerRefreshKey((k) => k + 1);
              setActiveTab('customers');
              setViewMode('console');
            }}
          />


          {/* Privacy & Security Settings */}
          <PrivacySettingsModal
            isOpen={settingsOpen}
            onClose={() => setSettingsOpen(false)}
          />

          {/* User Authentication Modal */}
          <AuthModal
            isOpen={authModalOpen}
            onClose={() => setAuthModalOpen(false)}
          />

        </div>
      </RoleProvider>
    </AuthProvider>
  );
}

