import { InventoryContextProvider } from "#base/context";

import { InventoryComponent } from "./InventoryComponent";

export const InventoryWrapper = () => {
    return (
        <InventoryContextProvider>
            <InventoryComponent />
        </InventoryContextProvider>
    );
}
