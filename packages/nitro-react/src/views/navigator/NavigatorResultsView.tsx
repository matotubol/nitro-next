import { useEffect } from 'react';

import { useNavigatorActions, useNavigatorSelectors, useTranslation } from '#base/context';
import { ScrollArea } from '#base/theme';

import { NavigatorResultBlockView } from './NavigatorResultBlockView';

/** `NavigatorView` gives a search four seconds before it stops waiting. */
const SEARCH_TIMEOUT_MS = 4000;

/** `block_results` plus the `search_waiting_for_results_mask` that covers it. */
export const NavigatorResultsView = () => {
    const { blocks, isSearching, hasSearched } = useNavigatorSelectors();
    const { setIsSearching } = useNavigatorActions();
    const t = useTranslation();

    // a search the server never answers must not leave the list masked forever
    useEffect(() => {
        if (!isSearching) return;

        const timeout = window.setTimeout(() => setIsSearching(false), SEARCH_TIMEOUT_MS);

        return () => window.clearTimeout(timeout);
    }, [isSearching, setIsSearching]);

    return (
        <>
            <ScrollArea variant="3" className="navigator-results" contentClassName="navigator-results-content">
                {blocks.map((x, index) => <NavigatorResultBlockView key={`${x.searchCode}-${index}`} block={x} />)}
                {(hasSearched && !blocks.length) && (
                    <div className="navigator-no-results">
                        <div className="navigator-no-results-text">
                            {t('navigator.search.returned.no.results', 'No rooms found')}
                        </div>
                    </div>
                )}
            </ScrollArea>
            {isSearching && <div className="navigator-busy-mask" />}
        </>
    );
}
