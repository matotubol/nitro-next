import { useShallow } from "zustand/shallow";

import { useRoomContext } from "../useRoomContext";

export const useRoomDecorationSelector = () => useRoomContext(useShallow(x => ({
    floorType: x.floorType,
    wallType: x.wallType,
    landscapeType: x.landscapeType,
})));
