import { FurnitureTypeEnum, IFurnitureData } from "@nitrodevco/nitro-api";
import { GetRoomEngine } from "@nitrodevco/nitro-renderer";

import { useConfigValue } from "#base/context";

/**
 * The icon lookup with nothing React about it, so callers that only have an
 * object id in hand - the room's pickup effect, for one - can resolve the same
 * url the catalog shows without standing up a component.
 */
export const GetFurnitureIconUrl = (productType: FurnitureTypeEnum | undefined, classId: number, extraParam: string, furnitureData: IFurnitureData | undefined, catalogAssetUrl: string): string => {
    switch (productType) {
        case FurnitureTypeEnum.Floor:
            return GetRoomEngine().getFurnitureFloorIconUrl(classId) ?? '';
        case FurnitureTypeEnum.Wall: {
            let iconName = '';

            switch (furnitureData?.className) {
                case 'floor':
                    iconName = ['th', furnitureData.className, extraParam].join('_');
                    break;
                case 'wallpaper':
                    iconName = ['th', 'wall', extraParam].join('_');
                    break;
                case 'landscape':
                    iconName = ['th', furnitureData.className, (extraParam || '').replace('.', '_'), '001'].join('_');
                    break;
            }

            if (iconName.length) return `${catalogAssetUrl}/${iconName}.png`;

            return GetRoomEngine().getFurnitureWallIconUrl(classId, extraParam) ?? '';
        }
        case FurnitureTypeEnum.Effect:
            return '';
        case FurnitureTypeEnum.HabboClub:
            return '';
        case FurnitureTypeEnum.Badge:
            return '';
        case FurnitureTypeEnum.Robot:
            return '';
    }

    return '';
}

export const useFurnitureIconUrl = (productType: FurnitureTypeEnum | undefined, classId: number, extraParam: string, furnitureData: IFurnitureData | undefined): string =>
    GetFurnitureIconUrl(productType, classId, extraParam, furnitureData, useConfigValue<string>('catalog.asset.url') ?? '');
