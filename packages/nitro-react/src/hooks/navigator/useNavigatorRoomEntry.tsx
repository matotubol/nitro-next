import { RoomDoorModeEnum } from '@nitrodevco/nitro-api';
import type { IRoomInfo } from '@nitrodevco/nitro-packets';
import { OpenFlatConnectionComposer } from '@nitrodevco/nitro-packets';
import { useCallback } from 'react';

import {
    NAVIGATOR_WINDOW,
    NavigatorDoorState,
    useNavigatorActions,
    useOwnUserId,
    useWebSocketContext,
    useWindowActions
} from '#base/context';

/** The flash client sends -1 for the home-room flag when entering from a list. */
const ENTER_FROM_LIST = -1;

/**
 * `HabboNavigator.goToPrivateRoom` - an open room is entered straight away, a
 * doorbell room parks on the bell until the owner answers, and a password room
 * asks first. The owner never gets stopped by their own door.
 */
export const useNavigatorRoomEntry = () => {
    const { send } = useWebSocketContext();
    const { setDoorData, setDoorState, setInfoRoom } = useNavigatorActions();
    const { hideWindow } = useWindowActions();
    const ownUserId = useOwnUserId();

    /** Connects unconditionally - the door checks have already been made. */
    const openRoom = useCallback((roomId: number, password: string = '') => {
        send(new OpenFlatConnectionComposer({ roomId, password, unknown1: ENTER_FROM_LIST }));
    }, [send]);

    const visitRoom = useCallback((roomInfo: IRoomInfo) => {
        setInfoRoom(undefined);

        const isOwner = roomInfo.ownerId === ownUserId;

        if (isOwner || roomInfo.doorMode === RoomDoorModeEnum.Open) {
            hideWindow(NAVIGATOR_WINDOW);

            openRoom(roomInfo.roomId);

            return;
        }

        if (roomInfo.doorMode === RoomDoorModeEnum.Password) {
            setDoorData({ roomInfo, state: NavigatorDoorState.Password });

            return;
        }

        // locked and invisible both ring the bell and wait for an answer
        setDoorData({ roomInfo, state: NavigatorDoorState.Start });

        openRoom(roomInfo.roomId);
    }, [hideWindow, openRoom, ownUserId, setDoorData, setInfoRoom]);

    /** Retries the connect with whatever the password prompt collected. */
    const submitPassword = useCallback((roomInfo: IRoomInfo, password: string) => {
        setDoorState(NavigatorDoorState.Waiting);

        openRoom(roomInfo.roomId, password);
    }, [openRoom, setDoorState]);

    const cancelDoor = useCallback(() => {
        setDoorData({ roomInfo: undefined, state: NavigatorDoorState.None });
    }, [setDoorData]);

    return { openRoom, visitRoom, submitPassword, cancelDoor };
}
