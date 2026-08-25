import { NavigatorSearchFilterType } from '@nitrodevco/nitro-api';
import { NewNavigatorSearchComposer } from '@nitrodevco/nitro-packets';
import { useCallback } from 'react';

import { joinFilter, useNavigatorActions, useNavigatorContext, useWebSocketContext } from '#base/context';

/**
 * Every result list in the navigator comes from one composer - the search code
 * picks the list, the filter narrows it. Tabs, quick links, drill-downs and the
 * text box all funnel through here.
 */
export const useNavigatorSearch = () => {
    const { send } = useWebSocketContext();
    const { setIsSearching, setFilter } = useNavigatorActions();
    const searchCode = useNavigatorContext(x => x.searchCode);
    const filteringData = useNavigatorContext(x => x.filteringData);

    const search = useCallback((code: string, filter: string = '') => {
        if (!code.length) return;

        setIsSearching(true);

        send(new NewNavigatorSearchComposer({ searchCodeOriginal: code, filteringData: filter }));
    }, [send, setIsSearching]);

    /** Runs the text box against whichever list is on screen. */
    const searchWithFilter = useCallback((filterType: NavigatorSearchFilterType, filterText: string) => {
        setFilter(filterType, filterText);

        search(searchCode, joinFilter(filterType, filterText.trim()));
    }, [search, setFilter, searchCode]);

    /** Switching tabs drops the filter, matching the flash client. */
    const searchTopLevel = useCallback((code: string) => {
        setFilter(NavigatorSearchFilterType.Anything, '');

        search(code);
    }, [search, setFilter]);

    const refresh = useCallback(() => search(searchCode, filteringData), [search, searchCode, filteringData]);

    return { search, searchWithFilter, searchTopLevel, refresh };
}
