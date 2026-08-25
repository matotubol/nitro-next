import { CloseConnectionMessage, OpenConnectionMessage } from "@nitrodevco/nitro-packets";

import { useSystemActions } from "#base/context";
import { useMessageListener } from "#base/hooks";

/**
 * Room presence is app-wide state: the inventory picks its furni request from it,
 * and placement/trading need the same answer, so it is tracked once here.
 */
export const useRoomPresenceHandler = () => {
    const { setIsInRoom } = useSystemActions();

    useMessageListener(OpenConnectionMessage, () => setIsInRoom(true));

    useMessageListener(CloseConnectionMessage, () => setIsInRoom(false));
}
