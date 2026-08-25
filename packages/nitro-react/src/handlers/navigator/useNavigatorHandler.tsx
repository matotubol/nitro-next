import {
    CanCreateRoomMessage,
    CantConnectMessage,
    DoorbellMessage,
    FavouriteChangedMessage,
    FavouritesMessage,
    FlatAccessDeniedMessage,
    FlatAccessibleMessage,
    FlatCreatedMessage,
    GenericErrorCode,
    GenericErrorMessage,
    GetGuestRoomComposer,
    GetGuestRoomResultMessage,
    GetUserEventCatsComposer,
    GetUserFlatCatsComposer,
    NavigatorCollapsedCategoriesMessage,
    NavigatorLiftedRoomsMessage,
    NavigatorMetadataMessage,
    NavigatorSavedSearchesMessage,
    NavigatorSearchResultBlocksMessage,
    NavigatorSettingsMessage,
    NewNavigatorInitComposer,
    NewNavigatorPreferencesMessage,
    NoSuchFlatEventMessage,
    RoomEntryInfoMessage,
    RoomForwardMessage,
    RoomInfoUpdatedMessage,
    RoomRatingMessage,
    RoomSettingsDataEventMessage,
    RoomSettingsSavedEventMessage,
    RoomSettingsSaveErrorEventMessage,
    UserEventCatsMessage,
    UserFlatCatsMessage,
    UserObjectMessage
} from '@nitrodevco/nitro-packets';
import { useRef } from 'react';

import {
    NAVIGATOR_WINDOW,
    NavigatorDoorState,
    useNavigatorActions,
    useNavigatorContext,
    useOwnUserId,
    useWebSocketContext,
    useWindowActions
} from '#base/context';
import { useMessageListener, useNavigatorRoomEntry } from '#base/hooks';

/**
 * Owns every navigator packet. Mounted for the life of the session rather than
 * with the window, because room entry and door answers arrive whether or not the
 * navigator is on screen.
 */
export const useNavigatorHandler = () => {
    const { send } = useWebSocketContext();
    const { hideWindow } = useWindowActions();
    const ownUserId = useOwnUserId();
    const { openRoom, visitRoom } = useNavigatorRoomEntry();
    const {
        setTopLevelContexts,
        setSearchResult,
        setSavedSearches,
        setCollapsedCategoryIds,
        setLiftedRooms,
        setPreferences,
        setFavourites,
        setFavourite,
        setHomeRoomId,
        setFlatCategories,
        setEventCategories,
        setCanCreateRoom,
        setIsCreatorOpen,
        setEnteredRoom,
        setCurrentRoom,
        setCurrentRoomRating,
        setDoorData,
        setDoorState,
        addDoorbellKnock,
        removeDoorbellKnock,
        clearDoorbellKnocks,
        setRoomSettingsData,
        setRoomSettingsError
    } = useNavigatorActions();
    const doorRoomInfo = useNavigatorContext(x => x.doorData.roomInfo);
    const isInitialized = useRef(false);

    // `HabboNewNavigator.onUserObject` - the metadata request rides in on login, so
    // the tab strip is ready before the window is opened for the first time
    useMessageListener(UserObjectMessage, () => {
        if (isInitialized.current) return;

        isInitialized.current = true;

        send(new NewNavigatorInitComposer({}), new GetUserFlatCatsComposer({}), new GetUserEventCatsComposer({}));
    });

    useMessageListener(NavigatorMetadataMessage, data => setTopLevelContexts(data.topLevelContexts));

    useMessageListener(NavigatorSearchResultBlocksMessage, data =>
        setSearchResult(data.searchCodeOriginal, data.filteringData, data.blocks));

    useMessageListener(NavigatorSavedSearchesMessage, data => setSavedSearches(data.savedSearches));

    useMessageListener(NavigatorCollapsedCategoriesMessage, data => setCollapsedCategoryIds(data.collapsedCategoryIds));

    useMessageListener(NavigatorLiftedRoomsMessage, data => setLiftedRooms(data.liftedRooms));

    useMessageListener(NewNavigatorPreferencesMessage, data => setPreferences(data.leftPaneHidden, data.resultsMode));

    useMessageListener(NavigatorSettingsMessage, data => setHomeRoomId(data.homeRoomId));

    useMessageListener(FavouritesMessage, data => setFavourites(data.limit, data.favoriteRoomIds));

    useMessageListener(FavouriteChangedMessage, data => setFavourite(data.roomId, data.added));

    useMessageListener(UserFlatCatsMessage, data => setFlatCategories(data.nodes));

    useMessageListener(UserEventCatsMessage, data => setEventCategories(data.eventCategories));

    // a non-zero result code means the account has hit its room limit
    useMessageListener(CanCreateRoomMessage, data => setCanCreateRoom(data.resultCode === 0, data.roomLimit));

    useMessageListener(FlatCreatedMessage, data => {
        setIsCreatorOpen(false);
        hideWindow(NAVIGATOR_WINDOW);

        openRoom(data.roomId);
    });

    // a forward is the server steering us somewhere - fetch the room first so the
    // door mode is known before we try to walk in
    useMessageListener(RoomForwardMessage, data =>
        send(new GetGuestRoomComposer({ roomId: data.roomId, enterRoom: false, roomForward: true })));

    useMessageListener(RoomEntryInfoMessage, data => {
        setEnteredRoom(undefined, false);
        setCurrentRoom(data.roomId, data.isOwner);
        setDoorData({ roomInfo: undefined, state: NavigatorDoorState.None });

        // knocks belong to the room we just left; the new room rings its own bell
        clearDoorbellKnocks();
        setRoomSettingsData(undefined);

        send(new GetGuestRoomComposer({ roomId: data.roomId, enterRoom: true, roomForward: false }));
    });

    useMessageListener(RoomInfoUpdatedMessage, data =>
        send(new GetGuestRoomComposer({ roomId: data.roomId, enterRoom: false, roomForward: false })));

    useMessageListener(GetGuestRoomResultMessage, data => {
        const roomInfo = data.roomInfo;

        if (data.enterRoom) {
            setDoorData({ roomInfo: undefined, state: NavigatorDoorState.None });
            setEnteredRoom(roomInfo, data.staffPick);
            setCurrentRoom(roomInfo.roomId, roomInfo.ownerId === ownUserId);

            return;
        }

        if (data.roomForward) {
            visitRoom(roomInfo);

            return;
        }

        setCurrentRoom(roomInfo.roomId, roomInfo.ownerId === ownUserId);
    });

    useMessageListener(RoomRatingMessage, data => setCurrentRoomRating(data.rating, data.canRate));

    // the bell is ringing - an empty name is our own knock, a name is somebody at
    // the door of a room we control and feeds the in-room doorbell widget
    useMessageListener(DoorbellMessage, data => {
        if (data.username && data.username.length) {
            addDoorbellKnock(data.username);

            return;
        }

        setDoorState(NavigatorDoorState.Waiting);
    });

    useMessageListener(FlatAccessibleMessage, data => {
        if (data.username && data.username.length) {
            removeDoorbellKnock(data.username);

            return;
        }

        setDoorData({ roomInfo: undefined, state: NavigatorDoorState.None });
        hideWindow(NAVIGATOR_WINDOW);
    });

    useMessageListener(FlatAccessDeniedMessage, data => {
        if (data.username && data.username.length) {
            removeDoorbellKnock(data.username);

            return;
        }

        setDoorState(NavigatorDoorState.NoAnswer);
    });

    useMessageListener(CantConnectMessage, () => {
        if (!doorRoomInfo) return;

        setDoorState(NavigatorDoorState.Unavailable);
    });

    // a wrong password comes back as a generic error, not a door packet
    useMessageListener(GenericErrorMessage, data => {
        if (data.errorCode !== GenericErrorCode.InvalidPassword || !doorRoomInfo) return;

        setDoorState(NavigatorDoorState.Failed);
    });

    useMessageListener(RoomSettingsDataEventMessage, data => setRoomSettingsData(data));

    useMessageListener(RoomSettingsSavedEventMessage, () => setRoomSettingsData(undefined));

    useMessageListener(RoomSettingsSaveErrorEventMessage, data =>
        setRoomSettingsError({ code: data.errorCode, info: data.info }));

    useMessageListener(NoSuchFlatEventMessage, () => setRoomSettingsData(undefined));

    return { visitRoom, openRoom };
}
