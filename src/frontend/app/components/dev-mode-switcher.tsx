"use client";

import { Building2, Globe } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouterMode } from "../contexts/router-mode";
import { useLocation } from "wouter";
import { useZeroAuth } from "../zero";

export function DevModeSwitcher() {
  const [, setLocation] = useLocation();
  const { logout } = useZeroAuth();
  const { mode, setMode, tenantSlug, setTenantSlug, isDev } = useRouterMode();
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [localTenantSlug, setLocalTenantSlug] = useState(tenantSlug || "");
  const [showTenantInput, setShowTenantInput] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragOffsetRef = useRef(dragOffset);

  // Keep ref in sync with state for use in event handlers
  useEffect(() => {
    dragOffsetRef.current = dragOffset;
  }, [dragOffset]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest("button, input, select")) return;
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    },
    [position.x, position.y],
  );

  const handleMouseMove = useCallback((e: MouseEvent) => {
    setPosition({
      x: e.clientX - dragOffsetRef.current.x,
      y: e.clientY - dragOffsetRef.current.y,
    });
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Only show in dev mode
  if (!isDev) return null;

  const handleModeSwitch = async (newMode: "tenant" | "platform") => {
    if (newMode === "tenant") {
      // Require tenant ID before switching to tenant mode
      if (!localTenantSlug.trim()) {
        setShowTenantInput(true);
        return;
      }
      setTenantSlug(localTenantSlug.trim());
    }
    setMode(newMode);
    await logout();
    setLocation("/");
  };

  const handleTenantConfirm = async () => {
    if (!localTenantSlug.trim()) return;
    setTenantSlug(localTenantSlug.trim());
    setMode("tenant");
    await logout();
    setLocation("/");
  };

  const handleTenantChange = async () => {
    setTenantSlug(localTenantSlug);
    if (mode === "tenant") {
      await logout();
      setLocation("/");
    }
  };

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: This is a draggable dev-only widget, keyboard interaction not applicable
    <div
      ref={containerRef}
      className="fixed z-[9999] select-none"
      style={{ left: position.x, top: position.y }}
      onMouseDown={handleMouseDown}
    >
      {/* Collapsed button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-full bg-gray-900 text-white text-xs font-mono shadow-lg hover:bg-gray-800 cursor-move"
          title="Dev Mode Switcher (drag to move)"
        >
          {mode === "tenant" ? (
            <>
              <Building2 className="h-3 w-3" />
              <span>TENANT: {tenantSlug || "?"}</span>
            </>
          ) : (
            <>
              <Globe className="h-3 w-3" />
              <span>PLATFORM</span>
            </>
          )}
        </button>
      )}

      {/* Expanded panel */}
      {isOpen && (
        <div className="bg-gray-900 text-white rounded-lg shadow-2xl p-4 min-w-[250px] cursor-move">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Dev Mode
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white text-lg leading-none"
            >
              ×
            </button>
          </div>

          <div className="space-y-3">
            {/* Mode selector */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleModeSwitch("platform")}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded text-xs font-medium transition-colors ${
                  mode === "platform"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              >
                <Globe className="h-3 w-3" />
                Platform
              </button>
              <button
                type="button"
                onClick={() => handleModeSwitch("tenant")}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded text-xs font-medium transition-colors ${
                  mode === "tenant"
                    ? "bg-green-600 text-white"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              >
                <Building2 className="h-3 w-3" />
                Tenant
              </button>
            </div>

            {/* Tenant ID input (shown when switching to tenant mode or already in tenant mode) */}
            {(mode === "tenant" || showTenantInput) && (
              <div className="space-y-2">
                <span className="text-xs text-gray-400">
                  {showTenantInput
                    ? "Enter Tenant ID to continue"
                    : "Tenant ID"}
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={localTenantSlug}
                    onChange={(e) => setLocalTenantSlug(e.target.value)}
                    placeholder="tenant-id"
                    className={`flex-1 px-2 py-1 bg-gray-800 border rounded text-xs text-white placeholder-gray-500 focus:outline-none ${
                      showTenantInput && !localTenantSlug.trim()
                        ? "border-red-500 focus:border-red-400"
                        : "border-gray-700 focus:border-gray-500"
                    }`}
                    // biome-ignore lint/a11y/noAutofocus: autoFocus is intentional for UX when showing tenant input prompt
                    autoFocus={showTenantInput}
                  />
                  <button
                    type="button"
                    onClick={
                      showTenantInput ? handleTenantConfirm : handleTenantChange
                    }
                    disabled={showTenantInput && !localTenantSlug.trim()}
                    className={`px-2 py-1 rounded text-xs ${
                      showTenantInput && !localTenantSlug.trim()
                        ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                        : "bg-gray-700 hover:bg-gray-600"
                    }`}
                  >
                    {showTenantInput ? "Go" : "Set"}
                  </button>
                </div>
                {showTenantInput && (
                  <button
                    type="button"
                    onClick={() => setShowTenantInput(false)}
                    className="text-xs text-gray-500 hover:text-gray-400"
                  >
                    Cancel
                  </button>
                )}
              </div>
            )}

            <div className="text-[10px] text-gray-500 pt-2 border-t border-gray-800">
              Drag to move • Mode persists in localStorage
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
