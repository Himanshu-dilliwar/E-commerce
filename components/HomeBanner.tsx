import React from "react";
import { Title } from "../src/components/Text";
import Link from "next/link";
import Image from "next/image";
import { banner_1 } from "../../images";

const HomeBanner = () => {
  return (
    <div className="p-16 md:py-0 bg-shop_light_pink rounded-lg px-10 lg:px24 flex items-center justify-between">
      <div className="space-y-5 ">
        <Title>
          Grab upto 50% off on <br />
          slected headphones
        </Title>
        <Link
          className="bg-shop_dark_green/90 text-white/90 px-5 py-2 rounded-md text-sm font-semibold hover:text-white hover:bg-shop_dark_green hoverEffect"
          href={"/shop"}
        >
          Buy Now
        </Link>
      </div>
      <div>
        <Image
          src={banner_1}
          alt="banner"
          className="hidden md:inline-flex w-96"
        />
      </div>
    </div>
  );
};

export default HomeBanner;
