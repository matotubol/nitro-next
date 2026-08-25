import type { INavigatorQuickLink } from '@nitrodevco/nitro-api';
import { NavigatorAddSavedSearchComposer, NavigatorDeleteSavedSearchComposer } from '@nitrodevco/nitro-packets';
import { useCallback } from 'react';

import { useNavigatorContext, useWebSocketContext } from '#base/context';

import { useNavigatorSearch } from './useNavigatorSearch';

/**
 * `QuickLinksView` - the left pane. Saving a search bookmarks the code plus the
 * filter that produced the list, so reopening it reruns exactly that search.
 */
export const useNavigatorQuickLinks = () => {
    const { send } = useWebSocketContext();
    const savedSearches = useNavigatorContext(x => x.savedSearches);
    const searchCode = useNavigatorContext(x => x.searchCode);
    const filteringData = useNavigatorContext(x => x.filteringData);
    const { search } = useNavigatorSearch();

    const openQuickLink = useCallback((quickLink: INavigatorQuickLink) => {
        search(quickLink.searchCode, quickLink.filter);
    }, [search]);

    const saveSearch = useCallback((code: string = searchCode, filter: string = filteringData) => {
        if (!code.length) return;

        send(new NavigatorAddSavedSearchComposer({ searchCode: code, filter }));
    }, [filteringData, searchCode, send]);

    const deleteSearch = useCallback((searchId: number) => {
        send(new NavigatorDeleteSavedSearchComposer({ searchId }));
    }, [send]);

    const isSaved = useCallback((code: string, filter: string) =>
        savedSearches.some(x => x.searchCode === code && x.filter === filter), [savedSearches]);

    return { savedSearches, openQuickLink, saveSearch, deleteSearch, isSaved };
}
