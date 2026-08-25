import { useMemo } from 'react';

import {
    NAVIGATOR_HOTEL_VIEW,
    NAVIGATOR_MYWORLD_VIEW,
    NAVIGATOR_OFFICIAL_VIEW,
    NAVIGATOR_ROOM_ADS_VIEW,
    useNavigatorActions,
    useNavigatorSelectors,
    useTranslation
} from '#base/context';
import { useCatalogVisibility, useNavigatorRoomActions, useNavigatorSearch, useNavigatorVisibility } from '#base/hooks';
import { Border, cn, Frame, NitroIcon, TabButton, TabContext } from '#base/theme';

import { NavigatorQuickLinksView } from './NavigatorQuickLinksView';
import { NavigatorResultsView } from './NavigatorResultsView';
import { NavigatorRoomInfoView } from './NavigatorRoomInfoView';
import { NavigatorSearchView } from './NavigatorSearchView';

/**
 * The tab strip the flash client falls back to when the hotel has not configured
 * `navigator_top_level_contexts`, so the window is never left without tabs.
 */
const FALLBACK_SEARCH_CODES = [
    NAVIGATOR_OFFICIAL_VIEW,
    NAVIGATOR_HOTEL_VIEW,
    NAVIGATOR_MYWORLD_VIEW,
    NAVIGATOR_ROOM_ADS_VIEW
];

/** The beige panel behind the body - `<border style="3" color="0x0eceae0">`. */
const SURFACE_COLOR = '#eceae0';

export const NavigatorView = () => {
    const { topLevelContexts, searchCode, isLeftPaneHidden } = useNavigatorSelectors();
    const { setIsLeftPaneHidden, setIsCreatorOpen } = useNavigatorActions();
    const { searchTopLevel } = useNavigatorSearch();
    const { goToRandomRoom } = useNavigatorRoomActions();
    const { hideNavigator } = useNavigatorVisibility();
    const { showCatalog } = useCatalogVisibility();
    const t = useTranslation();

    const searchCodes = useMemo(() => {
        return topLevelContexts.length ? topLevelContexts.map(x => x.searchCode) : FALLBACK_SEARCH_CODES;
    }, [topLevelContexts]);

    // roomads and myworld swap the random-room button out for promote-a-room
    const isPromoteView = searchCode === NAVIGATOR_ROOM_ADS_VIEW || searchCode === NAVIGATOR_MYWORLD_VIEW;

    return (
        <>
            <Frame
                id="navigator"
                variant="3"
                className={cn('navigator-window', isLeftPaneHidden && 'is-left-pane-hidden')}
                caption={t('navigator.title', 'Navigator')}
                captionTextRecipe="bold-12"
                captionTextColor="#ffffff"
                onClose={hideNavigator}
                contentClassName="p-0!">
                <div className="navigator-root">
                    <Border variant="3" tintColor={SURFACE_COLOR} className="navigator-surface" />
                    <div className="navigator-tab-strip" />
                    <div className="navigator-tab-rule" />
                    <div
                        className="navigator-show-left"
                        role="button"
                        tabIndex={0}
                        title={t('navigator.tooltip.left.show.hide', 'Show quick links')}
                        onClick={() => setIsLeftPaneHidden(!isLeftPaneHidden)}>
                        <NitroIcon icon="icon-search_save" />
                    </div>
                    <TabContext variant="3" className="navigator-tabs" data-name="tabs">
                        {searchCodes.map(code => (
                            <TabButton
                                key={code}
                                textRecipe="regular-12"
                                textColor="#000000"
                                aria-selected={code === searchCode}
                                onClick={() => searchTopLevel(code)}>
                                {t(`navigator.toplevelview.${code}`, code.replace(/_view$/, '').replace(/_/g, ' '))}
                            </TabButton>
                        ))}
                    </TabContext>
                    <NavigatorQuickLinksView />
                    <div className="navigator-right-pane">
                        <NavigatorSearchView />
                        <NavigatorResultsView />
                        <div
                            className="navigator-action is-create"
                            role="button"
                            tabIndex={0}
                            title={t('navigator.tooltip.create.room', 'Create a room')}
                            onClick={() => setIsCreatorOpen(true)}>
                            <Border variant="4" className="navigator-action-frame" />
                            <div className="navigator-action-art" />
                            <div className="navigator-action-label">{t('navigator.create.room', 'Create a room')}</div>
                        </div>
                        {/* `onSearchResults` shows exactly one of these two, never both */}
                        {isPromoteView ? (
                            <div
                                className="navigator-action is-promote"
                                role="button"
                                tabIndex={0}
                                title={t('navigator.tooltip.promote.room', 'Promote a room')}
                                onClick={showCatalog}>
                                <Border variant="5" className="navigator-action-frame" />
                                <div className="navigator-action-art" />
                                <div className="navigator-action-label">{t('navigator.promote.room', 'Promote a room')}</div>
                            </div>
                        ) : (
                            <div
                                className="navigator-action is-random"
                                role="button"
                                tabIndex={0}
                                title={t('navigator.tooltip.random.room', 'Take me somewhere')}
                                onClick={() => goToRandomRoom()}>
                                <Border variant="5" className="navigator-action-frame" />
                                <div className="navigator-action-art" />
                                <div className="navigator-action-label">{t('navigator.random.room', 'Take me somewhere')}</div>
                            </div>
                        )}
                    </div>
                </div>
            </Frame>
            {/* the bubble hangs off the window's right edge, so it cannot live inside
                the frame's clipped, filtered content box */}
            <NavigatorRoomInfoView />
        </>
    );
}
