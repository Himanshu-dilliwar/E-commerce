import React from "react";
import { Product } from "../../sanity.types";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  product: Product;
  className?: string;
}

const AddToWishlist = ({ product, className }: Props) => {
  return (
    <div className={cn("absolute top-2 right-2 z-10", className)}>
      <button
        className={`p-2.5 rounded-full hover:bg-shop_dark_green hover:text-white hoverEffect bg-[#f1f3f8]`}
      >
        <Heart size={15} />
      </button>
    </div>
  );
};

export default AddToWishlist;
