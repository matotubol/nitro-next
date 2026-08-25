import type { IFurnitureListItem } from "@nitrodevco/nitro-packets";
import { FurniListAddOrUpdateEventMessage, FurniListEventMessage, FurniListInvalidateEventMessage, FurniListRemoveEventMessage, FurniListRemoveMultipleEventMessage } from "@nitrodevco/nitro-packets";
import { useRef } from "react";

import { useInventoryActions } from "#base/context";
import { useMessageListener } from "#base/hooks";

/**
 * FurniList arrives fragmented. The original client buffers the fragments and
 * only hands the strip a list once every slot is filled - a single fragment
 * message is passed straight through.
 */
export const useInventoryFurniMessages = () => {
    const { insertFurniture, addOrUpdateFurniture, removeFurniture, removeFurnitureMultiple, invalidateFurniture } = useInventoryActions();
    const fragments = useRef<(IFurnitureListItem[] | undefined)[] | undefined>(undefined);

    useMessageListener(FurniListEventMessage, data => {
        if (data.totalFragments === 1) {
            insertFurniture(data.items);

            return;
        }

        if (!fragments.current || fragments.current.length !== data.totalFragments) fragments.current = new Array(data.totalFragments).fill(undefined);

        fragments.current[data.currentFragment] = data.items;

        if (fragments.current.some(x => x === undefined)) return;

        insertFurniture(fragments.current.flatMap(x => x!));

        fragments.current = undefined;
    });

    useMessageListener(FurniListAddOrUpdateEventMessage, data => {
        addOrUpdateFurniture(data.items);
    });

    useMessageListener(FurniListRemoveEventMessage, data => {
        removeFurniture(data.itemId);
    });

    useMessageListener(FurniListRemoveMultipleEventMessage, data => {
        removeFurnitureMultiple(data.itemIds);
    });

    useMessageListener(FurniListInvalidateEventMessage, () => {
        // Marks the strip stale; it reloads the next time the view needs it.
        invalidateFurniture();
    });
}
