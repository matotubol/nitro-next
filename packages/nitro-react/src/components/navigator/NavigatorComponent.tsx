import { CanCreateRoomComposer } from '@nitrodevco/nitro-packets';
import { useEffect, useRef } from 'react';

import { useNavigatorActions, useNavigatorContext, useNavigatorSelectors, useWebSocketContext } from '#base/context';
import { useNavigatorHandler } from '#base/handlers';
import { useNavigatorSearch, useNavigatorVisibility } from '#base/hooks';
import { NavigatorDoorbellWidgetView } from '#base/views/navigator/NavigatorDoorbellWidgetView';
import { NavigatorDoorView } from '#base/views/navigator/NavigatorDoorView';
import { NavigatorRoomCreatorView } from '#base/views/navigator/NavigatorRoomCreatorView';
import { NavigatorRoomSettingsView } from '#base/views/navigator/NavigatorRoomSettingsView';
import { NavigatorView } from '#base/views/navigator/NavigatorView';

export const NavigatorComponent = () => {
    const { isVisible } = useNavigatorVisibility();
    const { searchCode, filteringData } = useNavigatorSelectors();
    const { search } = useNavigatorSearch();
    const { send } = useWebSocketContext();
    const isCreatorOpen = useNavigatorContext(x => x.isCreatorOpen);
    const { setInfoRoom, setIsCreatorOpen } = useNavigatorActions();

    // the packet handler outlives the window - a forward or a doorbell answer can
    // land at any time, and the door prompt has to be able to show without it
    useNavigatorHandler();

    // every open re-runs whatever search is on screen, so the rooms and their
    // user counts are fresh each time - read through refs so a result landing
    // (which changes the code and filter) never re-triggers the effect itself
    const searchCodeRef = useRef(searchCode);
    const filteringDataRef = useRef(filteringData);

    searchCodeRef.current = searchCode;
    filteringDataRef.current = filteringData;

    useEffect(() => {
        if (!isVisible) return;

        search(searchCodeRef.current, filteringDataRef.current);
    }, [isVisible, search]);

    // the room limit is only interesting once the creator is actually on screen
    useEffect(() => {
        if (!isCreatorOpen) return;

        send(new CanCreateRoomComposer({}));
    }, [isCreatorOpen, send]);

    // whoever closes the window - toolbar icon included - takes the bubble and
    // the creator down with it, so nothing floats without its window
    useEffect(() => {
        if (isVisible) return;

        setInfoRoom(undefined);
        setIsCreatorOpen(false);
    }, [isVisible, setInfoRoom, setIsCreatorOpen]);

    return (
        <>
            {isVisible && <NavigatorView />}
            <NavigatorRoomCreatorView />
            <NavigatorDoorView />
            <NavigatorDoorbellWidgetView />
            <NavigatorRoomSettingsView />
        </>
    );
}
