import React, { createContext, useContext, useState } from 'react';

export const ROLES = {
  PRIVACY_ADMIN: {
    id: 'PRIVACY_ADMIN',
    name: 'Privacy Administrator',
    badgeColor: 'bg-purple-50 text-purple-800 border-purple-200',
    description: 'Full governance control, pipeline orchestration & emergency decryption access.',
    revealAllowed: true,
    actorName: 'admin_security',
    defaultPurpose: 'REGULATORY_AUDIT'
  },
  CUSTOMER_SUPPORT: {
    id: 'CUSTOMER_SUPPORT',
    name: 'Customer Support Agent',
    badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    description: 'Authorized PII reveal for verified customer tickets & exception resolutions.',
    revealAllowed: true,
    actorName: 'support_agent_jane',
    defaultPurpose: 'CUSTOMER_SUPPORT'
  },
  MARKETING: {
    id: 'MARKETING',
    name: 'Marketing Specialist',
    badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
    description: 'Executes campaigns using blind tokens. Zero reveal access (strictly blocked).',
    revealAllowed: false,
    actorName: 'marketing_specialist_mark',
    defaultPurpose: 'MARKETING_OPTIMIZATION'
  },
  AUDITOR: {
    id: 'AUDITOR',
    name: 'Compliance Auditor',
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
    description: 'Inspects immutable tamper-evident audit logs & referential integrity.',
    revealAllowed: true,
    actorName: 'compliance_auditor_claire',
    defaultPurpose: 'REGULATORY_AUDIT'
  }
};

const RoleContext = createContext();

export function RoleProvider({ children }) {
  const [currentRoleKey, setCurrentRoleKey] = useState('PRIVACY_ADMIN');

  const currentRole = ROLES[currentRoleKey] || ROLES.PRIVACY_ADMIN;

  return (
    <RoleContext.Provider
      value={{
        role: currentRole,
        roleKey: currentRoleKey,
        setRoleKey: setCurrentRoleKey,
        allRoles: ROLES
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}
