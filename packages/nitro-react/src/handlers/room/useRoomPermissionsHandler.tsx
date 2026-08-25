import { RoomControllerLevelEnum } from "@nitrodevco/nitro-api";
import { CloseConnectionMessage, YouAreControllerMessage, YouAreNotControllerMessage, YouAreNotSpectatorMessage, YouAreOwnerMessage, YouArePlayingGameMessage } from "@nitrodevco/nitro-packets";

import { useRoomPermissionActions, useRoomSessionActions } from "#base/context";
import { useMessageListener } from "#base/hooks";

export const useRoomPermissionsHandler = () => {
    const { setControllerLevel, setIsRoomOwner } = useRoomPermissionActions();
    const { setIsPlayingGame, setIsSpectator } = useRoomSessionActions();

    useMessageListener(YouAreControllerMessage, data => {
        setControllerLevel(data.controllerLevel);
    });

    useMessageListener(YouAreNotControllerMessage, data => {
        setControllerLevel(RoomControllerLevelEnum.None);
    });

    useMessageListener(YouAreOwnerMessage, data => {
        setIsRoomOwner(true);
    });

    useMessageListener(YouArePlayingGameMessage, data => {
        setIsPlayingGame(data.isPlaying);
    });

    useMessageListener(YouAreNotSpectatorMessage, data => {
        setIsSpectator(false);
    });

    // rights are granted per room and only ever announced, never revoked - without
    // this the next room inherits whatever the last one handed out, and the UI
    // offers actions (placing furniture, picking it up) the server will refuse
    useMessageListener(CloseConnectionMessage, () => {
        setControllerLevel(RoomControllerLevelEnum.None);
        setIsRoomOwner(false);
    });
}