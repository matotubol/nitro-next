import { useContext } from 'react';
import { useStore } from 'zustand';

import { InventoryContext } from './InventoryContext';
import { InventoryContextStore } from './store/InventoryContextStore';

export const useInventoryContext = <T,>(selector: (state: InventoryContextStore) => T) => {
    const store = useContext(InventoryContext);

    if (!store) throw new Error('useInventoryContext must be used within InventoryContextProvider');

    return useStore(store, selector);
}
