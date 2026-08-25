import { useEffect } from "react";

import { useInventoryActions, useInventorySelectors, useIsWindowVisible } from "#base/context";
import { useInventoryFurniMessages, useInventoryFurniPlacementChain, useInventoryFurniRequest } from "#base/hooks";
import { InventoryView } from "#base/views/inventory/InventoryView"

export const InventoryComponent = () => {
    const isVisible = useIsWindowVisible('inventory');
    const { isFurniInitialized } = useInventorySelectors();
    const { requestFurnitureInitialization } = useInventoryFurniRequest();
    const { clearUnseenFurniture } = useInventoryActions();

    useInventoryFurniMessages();

    // keeps a repeated placement run going while this window is hidden
    useInventoryFurniPlacementChain();

    // `HabboInventory.checkCategoryInitilization`: opening the strip loads it once,
    // and an invalidate while it is open drops the flag so it reloads immediately
    useEffect(() => {
        if (!isVisible || isFurniInitialized) return;

        requestFurnitureInitialization();
    }, [isVisible, isFurniInitialized]);

    // `FurniModel.closingInventoryView`: the unseen markers clear when the strip
    // is closed, so reopening shows those items as already seen
    useEffect(() => {
        if (isVisible) return;

        clearUnseenFurniture();
    }, [isVisible]);

    if (!isVisible) return null;

    return <InventoryView />;
}
