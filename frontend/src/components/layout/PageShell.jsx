import React from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { EmergencyBanner } from './EmergencyBanner';
import { PageHeader } from '../ui/PageHeader';
import { ToastContainer } from '../ui/Toast';
import { useUIStore } from '../../features/useUIStore';

export function PageShell({
  title,
  subtitle,
  description,
  actionSlot,
  actions,
  breadcrumbs = [],
  children,
  fluid = false
}) {
  const { sidebarOpen } = useUIStore();
  const desc = description || subtitle;
  const actionElements = actions || actionSlot;

  return (
    <div className="min-h-screen bg-bg-base text-text-primary flex flex-col antialiased">
      <EmergencyBanner />
      <div className="flex flex-1">
        <Sidebar />
        <div className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ${sidebarOpen ? 'lg:ml-60' : 'lg:ml-16'}`}>
          <Topbar />
          <main className="flex-1 p-4 md:p-6 space-y-6">
            <div className={fluid ? 'w-full space-y-6' : 'max-w-[1440px] mx-auto w-full space-y-6'}>
              {(title || desc || actionElements || breadcrumbs.length > 0) && (
                <PageHeader
                  title={title}
                  description={desc}
                  breadcrumbs={breadcrumbs}
                  actions={actionElements}
                />
              )}
              {children}
            </div>
          </main>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}

export default PageShell;
