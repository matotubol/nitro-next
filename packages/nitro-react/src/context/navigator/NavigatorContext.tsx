import { createContext } from 'react';
import type { StoreApi } from 'zustand';

import { NavigatorContextStore } from './store/NavigatorContextStore';

export const NavigatorContext = createContext<StoreApi<NavigatorContextStore> | null>(null);
