import { useContext } from 'react';
import { useStore } from 'zustand';

import { RoomContext } from './RoomContext';
import { RoomStore } from './store';

export const useRoomContext = <T,>(selector: (state: RoomStore) => T) => {
    const ctx = useContext(RoomContext);

    if (!ctx) throw new Error('useRoomContext must be used within RoomContextProvider');

    return useStore(ctx, selector);
}

/**
 * The store itself rather than a slice of it, for the handful of callers that
 * run inside a synchronously dispatched room event and so cannot trust a value
 * captured at render - `getState()` is the only way to see writes made earlier
 * in the same call stack.
 */
export const useRoomStore = () => {
    const ctx = useContext(RoomContext);

    if (!ctx) throw new Error('useRoomStore must be used within RoomContextProvider');

    return ctx;
}
