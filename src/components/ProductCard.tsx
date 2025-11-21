import React from "react";
import { Product } from "../../sanity.types";
import { urlFor } from "@/sanity/lib/image";
import Image from "next/image";
import Link from "next/link";
import { Flame, StarIcon } from "lucide-react";
import AddToWishlist from "./AddToWishlist";
import { SubTitle } from "./Text";
import PriceView from "./PriceView";

const ProductCard = ({ product }: { product: Product }) => {
  return (
    <div className="text-sm border-[1px] border-dark_blue/20 rounded-md bg-white group">
      <div className="relative group overflow-hidden bg-shop_light_bg">
        {product?.images && (
          <Link href={`/product/${product?.slug?.current}`}>
            <Image
              src={urlFor(product.images[0]).url()}
              alt="productImage"
              width={500}
              height={500}
              priority
              className={`w-full h-64 object-contain overflow-hidden transition-transform bg-shop_light_bg duration-500 
              ${product?.stock !== 0 ? "group-hover:scale-105" : "opacity-50"}`}
            />
          </Link>
        )}
        <AddToWishlist product={product} />
        {product?.status === "sale" && (
          <p className="absolute top-2 z-10 text-xs border border-darkColor/50 px-2 rounded-full group-hover:border-shop_light_green group-hover:text-shop_light_green hoverEffect">
            Sale!
          </p>
        )}
        {product?.status === "new" && (
          <p className="absolute top-2 z-10 text-xs border border-darkColor/50 px-2 rounded-full group-hover:border-shop_light_green group-hover:text-shop_light_green hoverEffect">
            New Arrival
          </p>
        )}
        {product?.status === "hot" && (
          <Link
            href={"/deal"}
            className="absolute top-2 z-10 text-xs border border-darkColor/50 p-1 rounded-full group-hover:border-shop_light_green group-hover:text-shop_light_green hoverEffect"
          >
            <Flame
              size={18}
              fill="#fb6c08"
              className="text-shop_orange/50 group-hover:text-shop_orange hoverEffect"
            />
          </Link>
        )}
      </div>
      <div className="p-3 flex flex-col gap-2">
        {product?.categories && (
          <p className="uppercase line-clamp-1 text-xs text-shop_light_text">
            {product.categories.map((cat) => cat).join(", ")}
          </p>
        )}
        <SubTitle className="text-sm line-clamp-2">{product?.name}</SubTitle>
        <div>
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, index) => (
              <StarIcon
                size={13}
                key={index}
                className={
                  index < 4
                    ? "text-shop_lighter_green"
                    : "text-shop_lighter_text"
                }
                fill={index < 4 ? "#93d991" : "#ababab"}
              />
            ))}
          </div>
          <p className="text-shop_light_text"> 10 Reviews</p>
        </div>
        <div className="flex items-center gap-2.5">
          <p className="font-medium">In Stock</p>
          <p
            className={` ${product?.stock === 0 ? "text-red-600" : "text-shop_light_green/80 font-semibold"}`}
          >
            {(product?.stock as number) > 0 ? product?.stock : "Unaviable "}
          </p>
        </div>
        <PriceView
          price={product?.price}
          discount={product.discount}
          className="text-sm"
        />
      </div>
    </div>
  );
};

export default ProductCard;
