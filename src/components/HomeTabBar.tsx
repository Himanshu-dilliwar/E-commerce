import Link from "next/link";
import React from "react";
import { productType } from "../../constants/data";

interface props {
  selectedTab: string;
  onSelectedTab: (tab: string) => void;
}

const HomeTabBar = ({ selectedTab, onSelectedTab }: props) => {
  return (
    <div className="flex items-center justify-between flex-wrap gap-5">
      <div className="flex item-center gap-3 text-sm font-semibold">
        {productType?.map((item) => (
          <button
            onClick={() => onSelectedTab(item.title)}
            key={item?.title}
            className={`border border-shop_light_green/30 px-4 py-1.5 md:px-6 md:py-2 rounded-full hover:bg-shop_light_green hover:text-white hoverEffect ${selectedTab === item?.title ? "bg-shop_light_green text-white border-shop_light_green" : "bg-shop_light_green/20"}`}
          >
            {item?.title}
          </button>
        ))}
      </div>
      <Link
        href={"/shop"}
        className={`border border-shop_light_green/30 px-4 py-1.5 md:px-6 md:py-2 rounded-full hover:bg-shop_light_green hover:text-white hoverEffect`}
      >
        See All
      </Link>
    </div>
  );
};

export default HomeTabBar;
