import type { IFurnitureGroupItem } from "#base/context";
import { useFurnitureDataSelector } from "#base/context";

import { useFurnitureIconUrl } from "../logic/useFurnitureIconUrl";

export const useInventoryFurniIconUrl = (group: IFurnitureGroupItem | undefined) => {
    const { floorItems, wallItems } = useFurnitureDataSelector();
    const first = group?.items[0];
    const furnitureData = !group ? undefined : group.isWallItem ? wallItems[group.spriteId] : floorItems[group.spriteId];

    // wallpaper/floor/landscape thumbnails are keyed by the stuff data variant,
    // which is what the catalog passes as the offer's extra param
    return useFurnitureIconUrl(first?.itemType, group?.spriteId ?? -1, first?.stuffData.getLegacyString() ?? '', furnitureData);
}
