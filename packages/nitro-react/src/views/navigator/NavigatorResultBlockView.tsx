import { NavigatorActionAllowedType, NavigatorViewModeType } from '@nitrodevco/nitro-api';
import type { INavigatorSearchResultBlock } from '@nitrodevco/nitro-packets';
import { useMemo } from 'react';

import { NAVIGATOR_OFFICIAL_VIEW, useNavigatorSelectors, useTranslation } from '#base/context';
import { useNavigatorCategoryActions, useNavigatorQuickLinks } from '#base/hooks';
import { cn, NitroIcon } from '#base/theme';

import { NavigatorRoomRowView } from './NavigatorRoomRowView';
import { NavigatorRoomTileView } from './NavigatorRoomTileView';

type NavigatorResultBlockViewProps = {
    block: INavigatorSearchResultBlock;
}

/** `RoomEntryElementFactory.TILES_PER_CONTAINER` */
const TILES_PER_ROW = 3;

/**
 * `CategoryElementFactory` - one category. The header carries the collapse
 * toggle, the row/tile switch, the drill-down and the bookmark, in that order
 * and right aligned, the way `category_controls_itemlist` lays them out.
 */
export const NavigatorResultBlockView = ({ block }: NavigatorResultBlockViewProps) => {
    const { isCollapsed, toggleCollapse, getViewMode, changeViewMode, showMore, canShowMore, canGoBack } = useNavigatorCategoryActions();
    const { saveSearch } = useNavigatorQuickLinks();
    const { searchCode } = useNavigatorSelectors();
    const t = useTranslation();

    const collapsed = isCollapsed(block.searchCode);
    const isTiles = getViewMode(block) === NavigatorViewModeType.Tiles;
    // `getOpenCategoryElement` swaps the collapse arrow out for a back arrow once
    // the server says this block is a drill-down
    const isBack = block.actionAllowed === NavigatorActionAllowedType.Back;
    // the official view's categories are the hotel's, not something a player picked out
    const canSave = searchCode.indexOf(NAVIGATOR_OFFICIAL_VIEW) === -1;
    const caption = block.text && block.text.length ? block.text : t(`navigator.searchcode.title.${block.searchCode}`, block.searchCode);

    const tileRows = useMemo(() => {
        if (!isTiles) return [];

        const rows: (typeof block.results)[] = [];

        for (let i = 0; i < block.results.length; i += TILES_PER_ROW) rows.push(block.results.slice(i, i + TILES_PER_ROW));

        return rows;
    }, [block.results, isTiles]);

    return (
        <div className="navigator-block">
            <div className={cn('navigator-block-header', collapsed && 'is-collapsed')}>
                {isBack ? (
                    <button
                        type="button"
                        className="navigator-block-toggle"
                        aria-label={t('navigator.back', 'Back')}
                        onClick={() => showMore(block.searchCode)}>
                        <NitroIcon icon="icon-nav-mini" />
                    </button>
                ) : (
                    <button
                        type="button"
                        className="navigator-block-toggle"
                        aria-label={t(collapsed ? 'navigator.tooltip.category.expand' : 'navigator.tooltip.category.collapse', collapsed ? 'Expand' : 'Collapse')}
                        onClick={() => toggleCollapse(block.searchCode)}>
                        <NitroIcon icon={collapsed ? 'icon-nav-plus' : 'icon-nav-minus'} />
                    </button>
                )}
                <div
                    className="navigator-block-name-region"
                    role="button"
                    tabIndex={0}
                    title={caption}
                    onClick={() => toggleCollapse(block.searchCode)}>
                    <div className="navigator-block-name">{caption}</div>
                </div>
                <div className="navigator-block-controls">
                    {(!collapsed && !isTiles) && (
                        <button
                            type="button"
                            className="navigator-block-control"
                            aria-label={t('navigator.tooltip.tiles', 'Thumbnails')}
                            onClick={() => changeViewMode(block.searchCode, NavigatorViewModeType.Tiles)}>
                            <NitroIcon icon="icon-nav-thumbnail" />
                        </button>
                    )}
                    {(!collapsed && isTiles) && (
                        <button
                            type="button"
                            className="navigator-block-control"
                            aria-label={t('navigator.tooltip.rows', 'List')}
                            onClick={() => changeViewMode(block.searchCode, NavigatorViewModeType.Rows)}>
                            <NitroIcon icon="icon-nav-inline" />
                        </button>
                    )}
                    {canShowMore(block) && (
                        <button
                            type="button"
                            className="navigator-block-control"
                            aria-label={t('navigator.tooltip.category.show.more', 'Show more')}
                            onClick={() => showMore(block.searchCode)}>
                            <NitroIcon icon="icon-nav-show-more" />
                        </button>
                    )}
                    {(!collapsed && canGoBack(block)) && (
                        <button
                            type="button"
                            className="navigator-block-control"
                            aria-label={t('navigator.back', 'Back')}
                            onClick={() => showMore(block.searchCode)}>
                            <NitroIcon icon="icon-nav-mini" />
                        </button>
                    )}
                    {canSave && (
                        <button
                            type="button"
                            className="navigator-block-control is-wide"
                            aria-label={t('navigator.tooltip.add.saved.search', 'Save this search')}
                            onClick={() => saveSearch(block.searchCode, '')}>
                            <NitroIcon icon="icon-search_save" />
                        </button>
                    )}
                </div>
            </div>
            {!collapsed && (
                <div className={cn('navigator-block-body', isTiles && 'is-tiles')}>
                    {isTiles
                        ? tileRows.map((row, index) => (
                            <div key={index} className="navigator-tile-row">
                                {row.map(x => <NavigatorRoomTileView key={x.roomId} roomInfo={x} />)}
                            </div>
                        ))
                        : block.results.map((x, index) => <NavigatorRoomRowView key={x.roomId} roomInfo={x} index={index} />)}
                </div>
            )}
        </div>
    );
}
