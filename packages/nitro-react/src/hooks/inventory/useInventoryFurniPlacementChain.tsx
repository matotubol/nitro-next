import type { RoomEngineObjectPlacedEvent } from "@nitrodevco/nitro-api";
import { RoomEngineObjectEvent } from "@nitrodevco/nitro-api";

import { useInventoryActions, useInventorySelectors, useWindowActions } from "#base/context";

import { useRoomEventDispatcher } from "../room/useRoomEventDispatcher";
import { useRoomObjectInsert } from "../room/useRoomObjectInsert";
import { useInventoryFurniPlacement } from "./useInventoryFurniPlacement";

/**
 * `FurniModel.onObjectPlaced` -> `attemptPlaceNextFurni`: dropping one item off a
 * stack immediately arms the next one, so a stack of ten places ten times
 * without a trip back to the strip. The strip only comes back when the stack
 * runs dry, or when the drop did not land in the room at all.
 *
 * Mounted once from `InventoryComponent`, which stays mounted while the window
 * is closed - the whole point is that the run continues with the strip hidden.
 */
export const useInventoryFurniPlacementChain = () => {
    const { placementRun } = useInventorySelectors();
    const { clearPlacementRun } = useInventoryActions();
    const { canPlace, placeSelectedFurniture } = useInventoryFurniPlacement();
    const { cancelObjectInsert } = useRoomObjectInsert();
    const { showWindow } = useWindowActions();

    const endRun = () => {
        clearPlacementRun();
        cancelObjectInsert();
        showWindow('inventory');
    };

    useRoomEventDispatcher<RoomEngineObjectPlacedEvent>(RoomEngineObjectEvent.PLACED, event => {
        // nothing to continue unless this placement belongs to a run we started
        if (!placementRun?.itemIds.length) return;

        // `-objectId == ref`: only our own placement advances the run
        if (event.objectId !== placementRun.itemIds[placementRun.itemIds.length - 1]) return;

        // dropped outside the room - the item never left the strip, so show it again
        if (!event.placedInRoom) {
            endRun();

            return;
        }

        // `canPlace` already reflects the next item, because the chain grew when
        // this one was armed - an empty stack fails the `NoItem` rung
        if (!canPlace) {
            endRun();

            return;
        }

        placeSelectedFurniture();
    });
};
