import {
    AddFavouriteRoomComposer,
    DeleteFavouriteRoomComposer,
    ForwardToARandomPromotedRoomComposer,
    RateFlatComposer,
    ToggleStaffPickComposer,
    UpdateHomeRoomComposer
} from '@nitrodevco/nitro-packets';
import { useCallback } from 'react';

import { useNavigatorContext, useWebSocketContext } from '#base/context';

/** `RoomInfoPopup` - the per room actions that hang off a result entry. */
export const useNavigatorRoomActions = () => {
    const { send } = useWebSocketContext();
    const favouriteRoomIds = useNavigatorContext(x => x.favouriteRoomIds);
    const homeRoomId = useNavigatorContext(x => x.homeRoomId);

    const isFavourite = useCallback((roomId: number) => favouriteRoomIds.indexOf(roomId) >= 0, [favouriteRoomIds]);

    const toggleFavourite = useCallback((roomId: number) => {
        send(isFavourite(roomId)
            ? new DeleteFavouriteRoomComposer({ roomId })
            : new AddFavouriteRoomComposer({ roomId }));
    }, [isFavourite, send]);

    /** Clicking the home marker on the room that already holds it clears it. */
    const toggleHomeRoom = useCallback((roomId: number) => {
        send(new UpdateHomeRoomComposer({ roomId: homeRoomId === roomId ? 0 : roomId }));
    }, [homeRoomId, send]);

    const toggleStaffPick = useCallback((roomId: number, isStaffPicked: boolean) => {
        send(new ToggleStaffPickComposer({ roomId, isStaffPicked }));
    }, [send]);

    const rateRoom = useCallback((points: number) => {
        send(new RateFlatComposer({ points }));
    }, [send]);

    const goToRandomRoom = useCallback((category: string = '') => {
        send(new ForwardToARandomPromotedRoomComposer({ category }));
    }, [send]);

    return { isFavourite, toggleFavourite, toggleHomeRoom, toggleStaffPick, rateRoom, goToRandomRoom, homeRoomId };
}
