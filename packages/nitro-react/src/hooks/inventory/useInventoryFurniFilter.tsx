import { useMemo } from "react";

import { PassesInventoryFilter, useFurnitureDataSelector, useInventorySelectors, useTranslation } from "#base/context";

import { useInventoryFurniName } from "./useInventoryFurniName";

/**
 * Applies the strip's placement, type and free-text filters, mirroring the order
 * `FurniGridView.passFilter` uses.
 */
export const useInventoryFurniFilter = () => {
    const { furnitureGroups, mainFilter, typeFilter, searchValue } = useInventorySelectors();
    const { floorItems, wallItems } = useFurnitureDataSelector();
    const { getFurnitureName, getFurnitureDescription } = useInventoryFurniName();
    const t = useTranslation();

    return useMemo(() => {
        const search = searchValue.trim().toLowerCase();

        return furnitureGroups.filter(group => PassesInventoryFilter(
            group,
            group.isWallItem ? wallItems[group.spriteId] : floorItems[group.spriteId],
            mainFilter,
            typeFilter,
            search,
            getFurnitureName(group),
            getFurnitureDescription(group)
        ));
        // getFurnitureName/Description close over the localization getter, which `t` tracks
    }, [furnitureGroups, mainFilter, typeFilter, searchValue, floorItems, wallItems, t]);
};
