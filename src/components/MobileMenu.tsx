"use client";
import { AlignLeft } from "lucide-react";
import React, { useState } from "react";
import Sidemenu from "./Sidemenu";

const MobileMenu = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  return (
    <>
      <button onClick={() => setSidebarOpen(!isSidebarOpen)}>
        <AlignLeft className="hover:text-darkColor hoverEffect md:hidden hover:cursor-pointer md:gap-0" />
      </button>
      <div className="md:hidden">
        <Sidemenu
          isOpen={isSidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      </div>
    </>
  );
};

export default MobileMenu;
