import { cn } from "@/lib/utils";
import React from "react";
import "./XLogo.css";

const XLogo = ({ className }: { className?: string }) => {
  return (
    <div className={cn("relative w-5 h-5 text-current x-logo-container", className)}>
      <div className="x-logo-border1" />
      <div className="x-logo-border2" />
      <div className="x-logo-border3" />
    </div>
  );
};

export default XLogo;