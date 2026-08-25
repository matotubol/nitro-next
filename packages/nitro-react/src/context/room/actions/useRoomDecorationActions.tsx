import { useShallow } from "zustand/shallow";

import { useRoomContext } from "#base/context";

export const useRoomDecorationActions = () => useRoomContext(useShallow(x => ({
    setRoomProperty: x.setRoomProperty,
})));
