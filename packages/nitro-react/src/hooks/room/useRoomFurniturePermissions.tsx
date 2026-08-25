import type { IRoomObject } from "@nitrodevco/nitro-api";
import { RoomControllerLevelEnum, RoomObjectCategoryEnum, RoomObjectVariableEnum } from "@nitrodevco/nitro-api";

import { useOwnIsModerator, useOwnUserId, useRoomPermissionsSelector, useRoomSelector } from "#base/context";

/**
 * The one place that answers "may this player touch furniture in this room".
 *
 * The server owns the real decision - `RoomSecurityModule.CanPlaceFurniAsync`
 * runs the same ladder again on every packet - so this only decides what the UI
 * is allowed to offer. Group rooms currently fall through the plain rights
 * check; when guild rules land they belong here and nowhere else.
 */
export const useRoomFurniturePermissions = () => {
    const room = useRoomSelector();
    const ownUserId = useOwnUserId();
    const isModerator = useOwnIsModerator();
    const { controllerLevel, isRoomOwner } = useRoomPermissionsSelector();

    const isFurnitureOwner = (object: IRoomObject | undefined) => !!object && (ownUserId === object.model.getValue<number>(RoomObjectVariableEnum.FurnitureOwnerId));

    /** Rights over every item in the room, regardless of who owns the item. */
    const hasFurnitureRights = () => !!room && (isRoomOwner || isModerator || controllerLevel >= RoomControllerLevelEnum.Guest);

    /** Rights over one item already standing in the room - its owner keeps control of it. */
    const canManipulateFurniture = (objectId: number, category: RoomObjectCategoryEnum) =>
        hasFurnitureRights() || (!!room && isFurnitureOwner(room.getRoomObject(objectId, category)));

    /**
     * Placement has no room object to fall back on, so item ownership cannot
     * grant it - only room rights can.
     */
    const canPlaceFurniture = () => hasFurnitureRights();

    return { isFurnitureOwner, hasFurnitureRights, canManipulateFurniture, canPlaceFurniture };
};
