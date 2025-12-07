import React from "react";
import { Title } from "./ui/text";
import Link from "next/link";
import Image from "next/image";
import { banner_1 } from "@/images";

const HomeBanner = () => {
  return (
    <div className="py-14 md:py-0 bg-gradient-to-r from-pink-50 to-pink-100 rounded-xl px-10 lg:px-20 flex items-center justify-between overflow-hidden">
      
      {/* Left Section */}
      <div className="space-y-4 max-w-md">
        <span className="inline-block bg-white/70 backdrop-blur-md text-pink-600 font-semibold px-3 py-1 rounded-full text-xs shadow-sm">
          New Collection
        </span>

        <Title className="leading-tight">
          Grab Upto 50% Off on <br />
          Selected Headphones
        </Title>

        <p className="text-gray-600 text-sm">
          Experience premium sound quality with our latest range.
        </p>

        <Link
          href={"/shop"}
          className="inline-block bg-shop_dark_green text-white px-6 py-2.5 rounded-md text-sm font-semibold hover:bg-shop_dark_green/90 transition-all"
        >
          Buy Now
        </Link>
      </div>

      {/* Right Section */}
      <div className="hidden md:flex items-center justify-center">
        <div>
          <Image
            src={banner_1}
            alt="banner_1"
            className="w-80 object-contain"
          />
        </div>
      </div>

    </div>
  );
};

export default HomeBanner;
