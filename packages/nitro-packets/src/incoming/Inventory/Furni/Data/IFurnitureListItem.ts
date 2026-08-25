import type { FurnitureSpecialType, FurnitureTypeEnum, IObjectData } from "@nitrodevco/nitro-api";

export interface IFurnitureListItem {
    itemId: number;
    itemType: FurnitureTypeEnum;
    roomItemId: number;
    spriteId: number;
    category: FurnitureSpecialType;
    stuffData: IObjectData;
    isRecyclable: boolean;
    isTradeable: boolean;
    isGroupable: boolean;
    isSellable: boolean;
    secondsToExpiration: number;
    hasRentPeriodStarted: boolean;
    flatId: number;
    slotId: string;
    extra: number;
    isWallItem: boolean;
    isRented: boolean;
}
