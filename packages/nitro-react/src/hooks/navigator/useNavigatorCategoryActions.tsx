import { NavigatorActionAllowedType, NavigatorViewModeType } from '@nitrodevco/nitro-api';
import type { INavigatorSearchResultBlock } from '@nitrodevco/nitro-packets';
import {
    NavigatorAddCollapsedCategoryComposer,
    NavigatorRemoveCollapsedCategoryComposer,
    NavigatorSetSearchCodeViewModeComposer
} from '@nitrodevco/nitro-packets';
import { useCallback } from 'react';

import { useNavigatorActions, useNavigatorContext, useWebSocketContext } from '#base/context';

import { useNavigatorSearch } from './useNavigatorSearch';

/**
 * `CategoryElementFactory` - the header of every result block. Collapsing and the
 * row/tile switch are both persisted server side, so the state survives a relog.
 */
export const useNavigatorCategoryActions = () => {
    const { send } = useWebSocketContext();
    const { toggleCollapsedCategory, setViewMode } = useNavigatorActions();
    const collapsedCategoryIds = useNavigatorContext(x => x.collapsedCategoryIds);
    const viewModeBySearchCode = useNavigatorContext(x => x.viewModeBySearchCode);
    const resultsMode = useNavigatorContext(x => x.resultsMode);
    const { search } = useNavigatorSearch();

    const isCollapsed = useCallback((searchCode: string) =>
        collapsedCategoryIds.indexOf(searchCode) >= 0, [collapsedCategoryIds]);

    const toggleCollapse = useCallback((searchCode: string) => {
        const collapsed = toggleCollapsedCategory(searchCode);

        send(collapsed
            ? new NavigatorAddCollapsedCategoryComposer({ categoryName: searchCode })
            : new NavigatorRemoveCollapsedCategoryComposer({ categoryName: searchCode }));
    }, [send, toggleCollapsedCategory]);

    /** The server sends a per block mode; anything it has not spoken for follows the window default. */
    const getViewMode = useCallback((block: INavigatorSearchResultBlock) => {
        return viewModeBySearchCode[block.searchCode] ?? block.viewMode ?? resultsMode;
    }, [resultsMode, viewModeBySearchCode]);

    const changeViewMode = useCallback((searchCode: string, viewMode: NavigatorViewModeType) => {
        setViewMode(searchCode, viewMode);

        send(new NavigatorSetSearchCodeViewModeComposer({ categoryName: searchCode, viewMode }));
    }, [send, setViewMode]);

    /** "Show more" drills into the block; "back" is the same call on the parent code. */
    const showMore = useCallback((searchCode: string) => search(searchCode), [search]);

    const canShowMore = useCallback((block: INavigatorSearchResultBlock) =>
        block.actionAllowed === NavigatorActionAllowedType.Collapsed
        || block.actionAllowed === NavigatorActionAllowedType.Expanded, []);

    const canGoBack = useCallback((block: INavigatorSearchResultBlock) =>
        block.actionAllowed === NavigatorActionAllowedType.Back, []);

    return { isCollapsed, toggleCollapse, getViewMode, changeViewMode, showMore, canShowMore, canGoBack };
}
