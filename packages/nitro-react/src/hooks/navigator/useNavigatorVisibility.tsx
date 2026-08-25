import { useCallback } from 'react';

import { useIsWindowVisible, useNavigatorActions, useWindowActions } from '#base/context';

export const NAVIGATOR_WINDOW = 'navigator';

export const useNavigatorVisibility = () => {
    const isVisible = useIsWindowVisible(NAVIGATOR_WINDOW);
    const { showWindow, hideWindow } = useWindowActions();
    const { setInfoRoom, setIsCreatorOpen } = useNavigatorActions();

    /** Closing the window takes the room bubble and the creator down with it. */
    const hideNavigator = useCallback(() => {
        setInfoRoom(undefined);
        setIsCreatorOpen(false);
        hideWindow(NAVIGATOR_WINDOW);
    }, [hideWindow, setInfoRoom, setIsCreatorOpen]);

    const showNavigator = useCallback(() => showWindow(NAVIGATOR_WINDOW), [showWindow]);

    const toggleNavigator = useCallback(() => {
        if (isVisible) {
            hideNavigator();

            return;
        }

        showNavigator();
    }, [hideNavigator, isVisible, showNavigator]);

    return { isVisible, showNavigator, hideNavigator, toggleNavigator };
}
