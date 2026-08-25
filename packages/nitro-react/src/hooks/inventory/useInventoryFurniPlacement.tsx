import { FurniturePlacementError, RoomObjectCategoryEnum, RoomObjectPlacementSource } from "@nitrodevco/nitro-api";
import type { IFurnitureListItem } from "@nitrodevco/nitro-packets";

import { GetFurniturePlacementError, GetNextPlaceableFurniture, useFurnitureDataSelector, useInventoryActions, useInventorySelectors, useIsInRoom, useSelectedFurnitureGroup, UsesLegacyStringPlacement, useWindowActions } from "#base/context";

import { useRoomFurniturePermissions } from "../room/useRoomFurniturePermissions";
import type { RoomObjectInsertData } from "../room/useRoomObjectInsert";
import { useRoomObjectInsert } from "../room/useRoomObjectInsert";

/**
 * `FurniModel.requestSelectedFurniPlacement`: hands the strip's selected item to
 * the room mover. Nothing is sent here - the packet only goes out once the item
 * is dropped on a tile, from `useRoomObjectPlace`.
 */
export const useInventoryFurniPlacement = () => {
    const group = useSelectedFurnitureGroup();
    const { placementRun } = useInventorySelectors();
    const { pushPlacementRun } = useInventoryActions();
    const isInRoom = useIsInRoom();
    const { wallItems } = useFurnitureDataSelector();
    const { canPlaceFurniture } = useRoomFurniturePermissions();
    const { initializeObjectInsert } = useRoomObjectInsert();
    const { hideWindow } = useWindowActions();

    // `GroupItem.peek` off the top of the stack, skipping whatever the current
    // repeated placement run already handed over
    const item = GetNextPlaceableFurniture(group, placementRun);

    const placementError = GetFurniturePlacementError(item, { isInRoom, hasRoomRights: canPlaceFurniture() });
    const canPlace = placementError === FurniturePlacementError.None;

    const getInsertData = (furniture: IFurnitureListItem): RoomObjectInsertData => {
        const isLegacyString = UsesLegacyStringPlacement(furniture, !!wallItems[furniture.spriteId]?.isExternalImage);

        return {
            // the ghost keeps the real item id so the room object the server adds
            // back lands on the same id and `RoomEngineObjectEvent.ADDED` can
            // reselect it
            objectId: furniture.itemId,
            category: furniture.isWallItem ? RoomObjectCategoryEnum.Wall : RoomObjectCategoryEnum.Floor,
            typeId: furniture.spriteId,
            instanceData: isLegacyString ? furniture.stuffData.getLegacyString() : furniture.extra.toString(),
            stuffData: isLegacyString ? undefined : furniture.stuffData,
            state: isLegacyString ? -1 : furniture.stuffData.state
        };
    };

    const placeSelectedFurniture = () => {
        if (!item || !canPlace) return placementError;

        if (!initializeObjectInsert(RoomObjectPlacementSource.INVENTORY, getInsertData(item))) return FurniturePlacementError.NotInRoom;

        if (group) pushPlacementRun(group.groupId, item.itemId);

        // `FurniModel.requestClose`: the strip gets out of the way so the ghost
        // following the cursor is actually visible
        hideWindow('inventory');

        return FurniturePlacementError.None;
    };

    return { placementError, canPlace, placeSelectedFurniture };
};
