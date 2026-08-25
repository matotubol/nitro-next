import type { INavigatorQuickLink } from '@nitrodevco/nitro-api';
import type { MouseEvent } from 'react';

import { useNavigatorActions, useNavigatorSelectors, useTranslation } from '#base/context';
import { useNavigatorQuickLinks } from '#base/hooks';
import { Border, NitroIcon, ScrollArea } from '#base/theme';

/** `left_pane_hide` is a colorless border tinted 0xfba800. */
const QUICK_LINKS_HEADER_COLOR = '#fba800';

const CATEGORY_PREFIX = 'category__';

/** `QuickLinksView` - the saved searches column down the left of the window. */
export const NavigatorQuickLinksView = () => {
    const { savedSearches, isLeftPaneHidden } = useNavigatorSelectors();
    const { setIsLeftPaneHidden } = useNavigatorActions();
    const { openQuickLink, deleteSearch } = useNavigatorQuickLinks();
    const t = useTranslation();

    if (isLeftPaneHidden) return null;

    const remove = (event: MouseEvent, searchId: number) => {
        event.stopPropagation();

        deleteSearch(searchId);
    };

    // `setQuickLinks` names a saved search after its code, drops the category
    // prefix when there is one, and appends the filter it was saved with
    const captionOf = (quickLink: INavigatorQuickLink) => {
        const name = quickLink.searchCode.indexOf(CATEGORY_PREFIX) === 0
            ? quickLink.searchCode.substr(CATEGORY_PREFIX.length)
            : t(`navigator.searchcode.title.${quickLink.searchCode}`, quickLink.searchCode);

        return quickLink.filter.length ? `${name} - ${quickLink.filter}` : name;
    };

    return (
        <Border variant="2" className="navigator-left-pane">
            <div
                className="navigator-left-header"
                role="button"
                tabIndex={0}
                title={t('navigator.tooltip.left.show.hide', 'Hide')}
                onClick={() => setIsLeftPaneHidden(true)}>
                <Border variant="2" tintColor={QUICK_LINKS_HEADER_COLOR} className="navigator-left-header-skin" />
                <NitroIcon icon="icon-search_save" className="navigator-left-header-icon" />
                <div className="navigator-left-title">{t('navigator.quick.links.title', 'Quick links')}</div>
            </div>
            <ScrollArea variant="100" className="navigator-quicklinks" contentClassName="navigator-quicklinks-content">
                {savedSearches.map(x => (
                    <div
                        key={x.id}
                        className="navigator-quicklink"
                        role="button"
                        tabIndex={0}
                        title={t('navigator.tooltip.open.saved.search', captionOf(x))}
                        onClick={() => openQuickLink(x)}>
                        <span className="navigator-quicklink-label">{captionOf(x)}</span>
                        <button
                            type="button"
                            className="navigator-quicklink-remove"
                            aria-label={t('navigator.tooltip.remove.saved.search', 'Remove')}
                            onClick={event => remove(event, x.id)}>
                            <NitroIcon icon="icon-nav-quicklink-remove" />
                        </button>
                    </div>
                ))}
            </ScrollArea>
        </Border>
    );
}
