import { MapDataType } from "@nitrodevco/nitro-api";
import type { IFurnitureListItem } from "@nitrodevco/nitro-packets";

import type { IFurnitureGroupItem } from "#base/context";
import { useTranslation } from "#base/context";

export const useInventoryFurniName = () => {
    const t = useTranslation();

    const getFurnitureName = (group: IFurnitureGroupItem | undefined) =>
        group ? t(`${group.isWallItem ? 'wallitem' : 'roomitem'}.name.${group.spriteId}`) : '';

    const getFurnitureDescription = (group: IFurnitureGroupItem | undefined) =>
        group ? t(`${group.isWallItem ? 'wallitem' : 'roomitem'}.desc.${group.spriteId}`) : '';

    /**
     * `FurniView.updateActionView`: an `external_image_wallitem` shows the caption
     * the photo was taken with - `stuffData.getJSONValue("m")` - in place of the
     * furniture line's description, which is the same for every photo.
     */
    const getPhotoMessage = (item: IFurnitureListItem | undefined) => {
        if (!(item?.stuffData instanceof MapDataType)) return '';

        return item.stuffData.getValue('m') ?? '';
    }

    /**
     * `furni_extra`: the original shows `inventory.rarity` for a rarity-stamped item
     * and `inventory.chest_name` for a chest. Only the rarity branch is portable -
     * `chestName` has no counterpart on `IObjectData` - so a chest shows nothing
     * here rather than a wrong label.
     */
    const getRarityLabel = (item: IFurnitureListItem | undefined) => {
        if (!(item?.stuffData instanceof MapDataType)) return '';

        // gated on the map actually carrying "rarity", not just a non-negative level
        if (item.stuffData.rarityLevel < 0 || !item.stuffData.getValue('rarity')) return '';

        return t('inventory.rarity', '', { rarity: String(item.stuffData.rarityLevel) });
    }

    return { getFurnitureName, getFurnitureDescription, getPhotoMessage, getRarityLabel };
}
