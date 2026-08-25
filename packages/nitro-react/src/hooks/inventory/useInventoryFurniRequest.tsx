import { RequestFurniInventoryComposer, RequestFurniInventoryWhenNotInRoomComposer } from "@nitrodevco/nitro-packets";

import { useIsInRoom, useWebSocketContext } from "#base/context";

/**
 * `FurniModel.requestInitialization`: the in-room request is a separate header
 * so the server can skip the room-side bookkeeping when the player is outside.
 */
export const useInventoryFurniRequest = () => {
    const isInRoom = useIsInRoom();
    const { send } = useWebSocketContext();

    const requestFurnitureInitialization = () => send(isInRoom
        ? new RequestFurniInventoryComposer({})
        : new RequestFurniInventoryWhenNotInRoomComposer({}));

    return { requestFurnitureInitialization };
}
