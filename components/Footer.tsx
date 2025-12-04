import React from "react";
import Container from "./Container";
import FooterTop from "./FooterTop";
import Logo from "./Logo";
import SocialMedia from "./SocialMedia";
import { SubText, SubTitle } from "./Text";
import { categoriesData, quickLinksData } from "@/constants/data";
import Link from "next/link";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

const Footer = () => {
  return (
    <footer>
      <Container className="bg-white border-t">
        <FooterTop />
        <div className=" py-12 gap-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <Logo />
            <SubText className="text-gray-600 text-sm">
              Discover curated furniture collectuins at Shoprilla, blending
              style and comfort to elevate your living spaces
            </SubText>
            <SocialMedia
              className="text-darkColor/60 "
              iconClassName="border-darkColor-60 hover:border-shop_light_green hover:text-shop_light_green"
              tooltipClassName="text-white bg-darkColor"
            />
          </div>
          <div>
            <SubTitle>Quick Links</SubTitle>
            <ul className="space-y-3 mt-4 font-poppins">
              {quickLinksData?.map((item, index) => (
                <li key={index}>
                  <Link
                    href={item.href}
                    className="hoveer:text-shop_light_green hoverEffect font-medium"
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <SubTitle>Categories</SubTitle>
            <ul className="space-y-3 mt-4 font-poppins">
              {categoriesData?.map((item, index) => (
                <li key={index}>
                  <Link
                    href={`/category/${item?.href}`}
                    className="hoveer:text-shop_light_green hoverEffect font-medium"
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-4">
            <SubTitle>News Letter</SubTitle>
            <SubText>
              Subscribe to our newsletter to receive updates and exclusive
              offers
            </SubText>
            <form className="space-y-3">
              <Input placeholder="Enter Your Email" type="email" required />
              <Button className="w-full">Subscribe</Button>
            </form>
          </div>
        </div>
        <div className="py-6 border-t text-center text-sm text-gray-600">
          <p>
            ©{new Date().getFullYear()}{" "}
            <span className="text-darkColor font-black  tracking-wider uppercase hover:text-shop_dark_green hoverEffect group font-sans">
              Shoprilla
            </span>
            . All rights reserved.
          </p>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
