import type { ReactNode } from 'react';
import { useState } from 'react';

import { InventoryContext } from './InventoryContext';
import { createInventoryContextStore } from './store';

type ProviderProps = {
    children: ReactNode;
}

export const InventoryContextProvider = ({ children }: ProviderProps) => {
    const [ctx] = useState(() => createInventoryContextStore());

    return (
        <InventoryContext value={ctx}>
            {children}
        </InventoryContext>
    );
};
