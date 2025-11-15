import { cn } from "@/lib/utils";
import React from "react";

const XLogo = ({ className }: { className?: string }) => {
  return (
    <div className={cn("relative w-5 h-5 text-current", className)}>
      <div
        className="absolute border-solid"
        style={{
          borderTopWidth: "6.2%",
          borderBottomWidth: "6.2%",
          borderLeftWidth: "6.9%",
          borderRightWidth: "6.9%",
          top: 0,
          left: "calc(50% - 14.2%)",
          width: "28%",
          transform: "skew(35deg)",
          height: "100%",
        }}
      />
      <div
        className="absolute border-solid bg-current"
        style={{
          width: 0,
          borderWidth: "4.2%",
          height: "45%",
          transform: "skew(-41deg)",
          top: 0,
          left: "calc(50% + 18.4%)",
          borderBottomLeftRadius: "15%",
        }}
      />
      <div
        className="absolute border-solid bg-current"
        style={{
          width: 0,
          borderWidth: "4.2%",
          height: "45%",
          transform: "skew(-41deg)",
          left: "calc(50% - 30.4%)",
          bottom: 0,
          borderTopRightRadius: "5%",
        }}
      />
    </div>
  );
};

export default XLogo;