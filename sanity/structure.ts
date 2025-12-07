import type { StructureResolver } from "sanity/desk";
import { BasketIcon } from "@sanity/icons";

export const structure: StructureResolver = (S) =>
  S.list()
    .title("Content")
    .items([
      // Orders section
      S.listItem()
        .title("Orders")
        .icon(BasketIcon)
        .child(
          S.list()
            .title("Orders")
            .items([
              S.listItem()
                .title("All Orders")
                .child(
                  S.documentTypeList("order")
                    .title("All Orders")
                    .filter('_type == "order"')
                ),

              S.listItem()
                .title("Paid Orders")
                .child(
                  S.documentTypeList("order")
                    .title("Paid Orders")
                    .filter('_type == "order" && status == "paid"')
                ),

              S.listItem()
                .title("Pending / Created")
                .child(
                  S.documentTypeList("order")
                    .title("Pending / Created Orders")
                    .filter('_type == "order" && (status == "created" || status == "pending")')
                ),

              S.listItem()
                .title("Shipped")
                .child(
                  S.documentTypeList("order")
                    .title("Shipped Orders")
                    .filter('_type == "order" && status == "shipped"')
                ),

              S.listItem()
                .title("Delivered")
                .child(
                  S.documentTypeList("order")
                    .title("Delivered Orders")
                    .filter('_type == "order" && status == "delivered"')
                ),
            ])
        ),

      S.divider(),

      // Default lists for other types (product, category, etc)
      ...S.documentTypeListItems().filter(
        (item) => item.getId() !== "order" // avoid duplicate Orders
      ),
    ]);
