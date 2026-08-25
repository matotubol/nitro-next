import { InventoryCategoryEnum } from "@nitrodevco/nitro-api";
import { useShallow } from "zustand/shallow";

import { useInventoryContext } from "../useInventoryContext";

export const useInventorySelectors = () => useInventoryContext(useShallow(x => ({
    isFurniInitialized: x.initializedCategories.includes(InventoryCategoryEnum.Furni),
    furnitureGroups: x.furnitureGroups,
    selectedGroupId: x.selectedGroupId,
    mainFilter: x.mainFilter,
    typeFilter: x.typeFilter,
    searchValue: x.searchValue,
    placementRun: x.placementRun
})));
