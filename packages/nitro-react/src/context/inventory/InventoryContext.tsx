import { createContext } from 'react';
import type { StoreApi } from 'zustand';

import { InventoryContextStore } from './store/InventoryContextStore';

export const InventoryContext = createContext<StoreApi<InventoryContextStore> | null>(null);
