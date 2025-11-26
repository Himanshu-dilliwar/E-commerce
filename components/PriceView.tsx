import React from "react";

interface Props {
  price: number | undefined;
  discount: number | undefined;
  className?: string;
}

const PriceView = ({ price, discount, className }: Props) => {
  return (
    <div>
      <div>
        <p>{price}</p>
      </div>
    </div>
  );
};

export default PriceView;
