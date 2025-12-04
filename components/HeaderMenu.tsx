"use client";
import React from "react";
import { headerData } from "@/constants/data";
import Link from "next/link";
import { usePathname } from "next/navigation";

const HeaderMenu = () => {
  const pathname = usePathname();
  console.log(pathname);

  return (
    <div className="hidden md:inline-flex w-1/3 items-center gap-7 text-sm capitalize font-semibold text-lightColor">
      {headerData?.map((item) => (
        <Link
          className={`hover:text-shop_light_green hoverEffect relative group ${
            pathname === item?.href && "text-shop_light_green"
          }`}
          href={item?.href}
          key={item?.title}
        >
          {item?.title}
          <span
            className={`absolute -bottom-0.5 left-1/2 w-0 h-0.5 bg-shop_light_green group-hover:w-1/2 hoverEffect group-hover:left-0 ${
              pathname === item?.href && "w-1/2"
            }`}
          />
          <span
            className={`absolute -bottom-0.5 right-1/2 w-0 h-0.5 bg-shop_light_green group-hover:w-1/2 hoverEffect group-hover:right-0 ${
              pathname === item?.href && "w-1/2"
            }`}
          />
        </Link>
      ))}
    </div>
  );
};

export default HeaderMenu;
