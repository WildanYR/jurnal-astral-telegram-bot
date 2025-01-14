import { OrderCategory } from "../types/order_category.type";

interface OrderCategoryList {
  label: string;
  value: OrderCategory;
}

export const orderConst = {
  state: {
    GET_CATEGORY: "ORDER_GET_CATEGORY",
    GET_TITLE: "ORDER_GET_TITLE",
    GET_DESCRIPTION: "ORDER_GET_DESC",
  },
  callbackData: {
    CREATE: "ORDER_CREATE",
    CATEGORY: "ORDER_CATEGORY",
    GET_RESULT: "ORDER_GET_RESULT",
    WITH_DESCRIPTION: "ORDER_WITH_DESC",
  },
  category: [
    {
      label: "Dragon Ring",
      value: "DRAGON_RING",
    },
    {
      label: "Formasi Piramid",
      value: "FORMASI_PIRAMID",
    },
    {
      label: "List",
      value: "DEFAULT",
    },
  ] as OrderCategoryList[],
  webAppName: "order",
};
