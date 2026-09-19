import React, { useState } from 'react';
import { RoleProvider } from './context/RoleContext';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import Navigation from './components/Navigation';
import { HeroExplainer } from './components/onboarding/HeroExplainer';
import { AddCustomerModal } from './components/customers/AddCustomerModal';
import { PrivacySettingsModal } from './components/settings/PrivacySettingsModal';
import { AuthModal } from './components/auth/AuthModal';
import GuidedTourModal from './components/GuidedTourModal';

import ArchitectureTab from './components/tabs/ArchitectureTab';
import DiscoveryTab from './components/tabs/DiscoveryTab';
import PolicyTab from './components/tabs/PolicyTab';
import BatchTab from './components/tabs/BatchTab';
import CustomersTab from './components/tabs/CustomersTab';
import CampaignTab from './components/tabs/CampaignTab';
import WebhookTab from './components/tabs/WebhookTab';
import RevealTab from './components/tabs/RevealTab';
import GovernanceTab from './components/tabs/GovernanceTab';

export default function App() {
  const [activeTab, setActiveTab] = useState('architecture');
  const [tourOpen, setTourOpen] = useState(false);
  const [addCustomerOpen, setAddCustomerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'architecture':
        return <ArchitectureTab onSelectTab={setActiveTab} />;
      case 'discovery':
        return <DiscoveryTab />;
      case 'policy':
        return <PolicyTab />;
      case 'batch':
        return <BatchTab />;
      case 'customers':
        return <CustomersTab onOpenAddCustomer={() => setAddCustomerOpen(true)} />;
      case 'campaign':
        return <CampaignTab />;
      case 'webhook':
        return <WebhookTab />;
      case 'reveal':
        return <RevealTab />;
      case 'governance':
        return <GovernanceTab />;
      default:
        return <ArchitectureTab onSelectTab={setActiveTab} />;
    }
  };

  return (
    <AuthProvider>
      <RoleProvider>
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white font-sans antialiased">
          {/* Global Header */}
          <Header
            onOpenAddCustomer={() => setAddCustomerOpen(true)}
            onOpenSettings={() => setSettingsOpen(true)}
            onOpenAuth={() => setAuthModalOpen(true)}
            onOpenTour={() => setTourOpen(true)}
          />

          {/* Evaluation Screens Navigation Tabs */}
          <Navigation
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            onOpenTour={() => setTourOpen(true)}
          />

          {/* Main Content Area */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Interactive "How Our Application Works" Starting Onboarding Hero */}
            <HeroExplainer
              onOpenAddCustomer={() => setAddCustomerOpen(true)}
              onOpenSettings={() => setSettingsOpen(true)}
              onOpenTour={() => setTourOpen(true)}
            />

            {/* Active Tab Screen */}
            {renderTabContent()}
          </main>

          {/* 13-Point Guided Evaluation Tour Modal */}
          <GuidedTourModal
            isOpen={tourOpen}
            onClose={() => setTourOpen(false)}
            onSelectTab={setActiveTab}
          />

          {/* Add Customer & Live Ingestion Modal */}
          <AddCustomerModal
            isOpen={addCustomerOpen}
            onClose={() => setAddCustomerOpen(false)}
            onCustomerCreated={() => {
              setActiveTab('customers');
            }}
          />

          {/* Privacy & Security Settings (Cryptographic Key Fingerprints & 2FA Governance) */}
          <PrivacySettingsModal
            isOpen={settingsOpen}
            onClose={() => setSettingsOpen(false)}
          />

          {/* User Authentication & 2FA Modal */}
          <AuthModal
            isOpen={authModalOpen}
            onClose={() => setAuthModalOpen(false)}
          />

          {/* Enterprise Light Footer */}
          <footer className="border-t border-slate-200 bg-white py-4 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-indigo-600" />
                <span className="font-semibold text-slate-700">Flyyy.AI Privacy-Preserving Customer Data Platform</span>
              </div>
              <div className="font-mono text-[11px] text-slate-500">
                Format-Preserving Encryption (FF1 Radix-10) &bull; AES-256-GCM Vault &bull; HMAC Pseudonymization
              </div>
            </div>
          </footer>
        </div>
      </RoleProvider>
    </AuthProvider>
  );
}
