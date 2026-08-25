import { FurnitureTypeEnum, RoomObjectCategoryEnum, RoomObjectVariableEnum } from "@nitrodevco/nitro-api";
import { FurniId } from "@nitrodevco/nitro-renderer";

import { useConfigValue, useFurnitureDataSelector, useOwnUserId, useRoomSelector } from "#base/context";
import { createToolbarTransitionToIcon } from "#base/utils";

import { GetFurnitureIconUrl } from "../logic/useFurnitureIconUrl";

/**
 * `RoomEngine.disposeObjectFurniture`: when furniture leaves the room its icon
 * jumps from the tile it stood on into the toolbar's inventory button, so the
 * item is seen going somewhere rather than blinking out.
 *
 * The remove message names the picker, so the same broadcast that removes the
 * object for everyone only animates for the player who took it.
 */
export const useRoomFurniturePickupEffect = () => {
    const room = useRoomSelector();
    const ownUserId = useOwnUserId();
    const { floorItems, wallItems } = useFurnitureDataSelector();
    const catalogAssetUrl = useConfigValue<string>('catalog.asset.url') ?? '';

    /**
     * Must run *before* the object is removed - the icon, the picking flag and
     * the screen point all come off the room object that is about to go away.
     */
    const playPickupTransition = (objectId: number, category: RoomObjectCategoryEnum, pickerId: number) => {
        if (!room || pickerId !== ownUserId) return;

        // builders club furniture is a loan, not something that lands in a strip
        if (FurniId.isBuilderClubId(objectId)) return;

        const roomObject = room.getRoomObject(objectId, category);

        if (!roomObject) return;

        // presents opt out: the widget already animates the unwrapping
        if (roomObject.model.getValue<number>(RoomObjectVariableEnum.FurnitureDisablePickingAnimation) === 1) return;

        const screenLocation = room.getRoomObjectScreenLocation(objectId, category);

        if (!screenLocation) return;

        const typeId = roomObject.model.getValue<number>(RoomObjectVariableEnum.FurnitureTypeId);
        const isWall = category === RoomObjectCategoryEnum.Wall;
        const extras = roomObject.model.getValue<string>(RoomObjectVariableEnum.FurnitureExtras) ?? '';

        const url = GetFurnitureIconUrl(
            isWall ? FurnitureTypeEnum.Wall : FurnitureTypeEnum.Floor,
            typeId,
            extras,
            isWall ? wallItems[typeId] : floorItems[typeId],
            catalogAssetUrl
        );

        if (!url) return;

        createToolbarTransitionToIcon('inventory', { url, x: screenLocation.x, y: screenLocation.y });
    };

    return { playPickupTransition };
};
