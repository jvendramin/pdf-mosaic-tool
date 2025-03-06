
import React, { useState } from 'react';
import { cn } from "@/lib/utils";
import { FileText, Menu } from "lucide-react";
import { useLocation, Link } from "react-router-dom";

const Sidebar = () => {
  const [expanded, setExpanded] = useState(false);
  const location = useLocation();

  const sidebarItems = [
    { 
      name: "PDF Editor", 
      icon: <FileText size={20} />, 
      path: "/pdf-editor",
      active: location.pathname === "/pdf-editor" || location.pathname === "/"
    },
    // Future tools will be added here
  ];

  return (
    <div
      className={cn(
        "fixed h-screen bg-sidebar text-sidebar-foreground z-50 sidebar-transition",
        expanded ? "w-64" : "w-16"
      )}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <div className="flex flex-col h-full">
        <div className="py-6 px-4 flex items-center justify-center border-b border-sidebar-border">
          {expanded ? (
            <h1 className="text-xl font-semibold text-white animate-fade-in">
              myCDL
              <span className="text-cdl ml-1">.</span>
            </h1>
          ) : (
            <Menu className="text-white" />
          )}
        </div>

        <div className="flex-1 py-4 px-2 overflow-y-auto">
          <nav className="space-y-2">
            {sidebarItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={cn(
                  "flex items-center py-3 px-3 rounded-md sidebar-transition",
                  item.active
                    ? "bg-sidebar-accent text-cdl"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                )}
              >
                <div className="flex items-center justify-center w-6">
                  {item.icon}
                </div>
                {expanded && (
                  <span className="ml-3 whitespace-nowrap animate-fade-in">
                    {item.name}
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-sidebar-border">
          {expanded && (
            <div className="text-xs text-sidebar-foreground opacity-50 animate-fade-in">
              Creative Destruction Labs &copy; {new Date().getFullYear()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
