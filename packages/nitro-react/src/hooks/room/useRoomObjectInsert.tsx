import type { IObjectData } from "@nitrodevco/nitro-api";
import { RoomObjectCategoryEnum, RoomObjectOperationType, Vector3d } from "@nitrodevco/nitro-api";
import { SelectedRoomObjectData } from "@nitrodevco/nitro-renderer";

import { useRoomSelectedObjectActions, useRoomSelector, useRoomStore } from "#base/context";

import { useRoomObjectSelect } from "./useRoomObjectSelect";

/**
 * Everything the mover needs to draw a ghost for an object that is not in the
 * room yet. `instanceData` is the item's `extra` for ordinary furniture and the
 * stuff data legacy string for posters and external images, matching what
 * `requestSelectedFurniToMover` hands the engine.
 */
export type RoomObjectInsertData = {
    objectId: number;
    category: RoomObjectCategoryEnum;
    typeId: number;
    instanceData?: string;
    stuffData?: IObjectData;
    state?: number;
    frameNumber?: number;
    posture?: string;
};

/**
 * `initializeRoomObjectInsert` / `cancelRoomObjectInsert`: arming and disarming
 * placement mode. Nothing here is inventory-specific - the catalog places
 * through the same door, it just passes a different placement source so
 * `placeObject` knows not to send a second packet for an item it already bought.
 */
export const useRoomObjectInsert = () => {
    const room = useRoomSelector();
    const roomStore = useRoomStore();
    const { setSelectedObject, setObjectPlacementSource, setRepeatedPlacement } = useRoomSelectedObjectActions();
    const { resetSelectedObject } = useRoomObjectSelect();

    const initializeObjectInsert = (placementSource: string, data: RoomObjectInsertData) => {
        if (!room) return false;

        // a placement still in flight is dropped before the next one arms, or its
        // ghost is left behind in the room. read live: a repeated placement run
        // arms the next item from inside the placed event, while a render-time
        // value would still name the item that was just put down
        const inFlight = roomStore.getState().selectedObject;

        if (inFlight) resetSelectedObject(inFlight);

        const { objectId, category, typeId, instanceData = '', stuffData, state = -1, frameNumber = -1, posture = '' } = data;

        setObjectPlacementSource(placementSource);

        // `initializeRoomObjectInsert`: only another floor copy of the same type
        // inherits the remembered facing - anything else starts the run over
        const remembered = roomStore.getState().repeatedPlacement;
        const inheritsFacing = category === RoomObjectCategoryEnum.Floor
            && remembered?.typeId === typeId
            && remembered.direction >= 0;

        if (!inheritsFacing) setRepeatedPlacement(undefined);

        // the ghost starts parked off-map so it only appears once the cursor
        // reaches a tile. it faces north unless a run is carrying a facing over,
        // which is safe because that only happens for the same type id - so the
        // angle is one the item already accepted
        setSelectedObject(new SelectedRoomObjectData(
            objectId,
            category,
            RoomObjectOperationType.OBJECT_PLACE,
            new Vector3d(-100, -100),
            new Vector3d(inheritsFacing ? remembered.direction : 0),
            typeId,
            instanceData,
            stuffData,
            state,
            frameNumber,
            posture,
        ));

        // the mover icon is prepared hidden - `handleObjectPlace` shows it again
        // whenever the pointer sits somewhere the item cannot go
        void room.setRoomOverlayIconSprite(typeId, category, false, instanceData, posture);
        room.setRoomOverlayIconSpriteVisibility(false);

        return true;
    };

    const cancelObjectInsert = () => {
        const inFlight = roomStore.getState().selectedObject;

        if (!inFlight) return;

        resetSelectedObject(inFlight);
    };

    return { initializeObjectInsert, cancelObjectInsert };
};
