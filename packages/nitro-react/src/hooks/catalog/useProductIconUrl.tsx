import { IProduct } from "@nitrodevco/nitro-api";

import { useFurnitureIconUrl } from "../logic/useFurnitureIconUrl";

export const useProductIconUrl = (product: IProduct) =>
    useFurnitureIconUrl(product.productType, product.classId, product.extraParam, product.furnitureData);
