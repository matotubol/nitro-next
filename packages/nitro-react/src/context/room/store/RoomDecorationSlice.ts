import type { StateCreator } from "zustand";

/**
 * The active room's floor, wallpaper and landscape. `RoomPropertyMessage` is the only
 * carrier for these, and it lands during room entry - sometimes before the `IRoom`
 * exists - so they are recorded here as well as pushed onto the room object. That
 * makes them readable by anything outside the room (the inventory preview decorates
 * itself like the room the furni would land in) and reactive, which reading the room
 * object's model is not.
 *
 * Fallbacks are the original client's: `FurniView.updateActionView` treats an empty
 * value as floor "101", wall "101", landscape "1.1".
 */
type State = {
    floorType: string;
    wallType: string;
    landscapeType: string;
}

type Actions = {
    setRoomProperty: (key: string, value: string) => void;
};

export const RoomDecorationSliceInitialState: State = {
    floorType: '101',
    wallType: '101',
    landscapeType: '1.1'
};

export type RoomDecorationSlice = State & Actions;

export const createRoomDecorationSlice: StateCreator<RoomDecorationSlice, [], [], RoomDecorationSlice> = set => ({
    ...RoomDecorationSliceInitialState,
    setRoomProperty: (key: string, value: string) => set(() => {
        if (!value.length) return {};

        // the wire keys are the original's: "floor", "wallpaper", "landscape"
        switch (key) {
            case 'floor':
                return { floorType: value };
            case 'wallpaper':
                return { wallType: value };
            case 'landscape':
                return { landscapeType: value };
            default:
                return {};
        }
    })
});
