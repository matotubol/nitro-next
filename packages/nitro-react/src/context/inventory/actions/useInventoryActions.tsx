import { useShallow } from "zustand/shallow";

import { useInventoryContext } from "../useInventoryContext";

export const useInventoryActions = () => useInventoryContext(useShallow(x => ({
    setCategoryInitialized: x.setCategoryInitialized,
    insertFurniture: x.insertFurniture,
    addOrUpdateFurniture: x.addOrUpdateFurniture,
    removeFurniture: x.removeFurniture,
    removeFurnitureMultiple: x.removeFurnitureMultiple,
    invalidateFurniture: x.invalidateFurniture,
    selectFurnitureGroup: x.selectFurnitureGroup,
    clearUnseenFurniture: x.clearUnseenFurniture,
    setMainFilter: x.setMainFilter,
    setTypeFilter: x.setTypeFilter,
    setSearchValue: x.setSearchValue,
    pushPlacementRun: x.pushPlacementRun,
    clearPlacementRun: x.clearPlacementRun
})));
