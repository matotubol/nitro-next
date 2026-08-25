import type { FurnitureSpecialType, IMessageDataWrapper } from "@nitrodevco/nitro-api";
import { FurnitureTypeEnum, GetObjectDataFromWrapper } from "@nitrodevco/nitro-api";

import type { IFurnitureListItem } from "./IFurnitureListItem";

export const FurnitureListItemParser = (wrapper: IMessageDataWrapper): IFurnitureListItem => {
    const item: IFurnitureListItem = {
        itemId: wrapper.readInt(),
        itemType: wrapper.readString().toLowerCase() as FurnitureTypeEnum,
        roomItemId: wrapper.readInt(),
        spriteId: wrapper.readInt(),
        category: wrapper.readInt() as FurnitureSpecialType,
        stuffData: GetObjectDataFromWrapper(wrapper),
        isRecyclable: wrapper.readBoolean(),
        isTradeable: wrapper.readBoolean(),
        isGroupable: wrapper.readBoolean(),
        isSellable: wrapper.readBoolean(),
        secondsToExpiration: wrapper.readInt(),
        hasRentPeriodStarted: wrapper.readBoolean(),
        flatId: wrapper.readInt(),
        slotId: '',
        extra: 0,
        isWallItem: false,
        isRented: false
    };

    item.isRented = item.secondsToExpiration > -1;

    if (!item.isRented) item.secondsToExpiration = -1;

    item.isWallItem = item.itemType === FurnitureTypeEnum.Wall;

    if (item.itemType === FurnitureTypeEnum.Floor) {
        item.slotId = wrapper.readString();
        item.extra = wrapper.readInt();
    }

    return item;
}
