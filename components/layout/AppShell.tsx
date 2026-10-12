"use client";

import React from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { MobileBottomNav } from "./MobileBottomNav";
import { useAuth } from "@/lib/mock-auth";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex bg-[var(--bg)] text-[var(--text-primary)]">
      {/* Sidebar Desktop */}
      {user && <Sidebar />}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {user && <Topbar />}

        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 max-w-7xl w-full mx-auto">
          {children}
        </main>

        {/* Mobile Navigation */}
        {user && <MobileBottomNav />}
      </div>
    </div>
  );
}
