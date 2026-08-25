import { NavigatorSearchFilterType } from '@nitrodevco/nitro-api';
import type { KeyboardEvent } from 'react';
import { useRef, useState } from 'react';

import { useNavigatorSelectors, useTranslation } from '#base/context';
import { useNavigatorSearch, useOutsideClick } from '#base/hooks';
import { Border, Button, Dropmenu, DropmenuItem, NitroIcon } from '#base/theme';

/** The `item_array` on `filter_type_drop_menu`, in the order flash lists it. */
const FILTER_OPTIONS: [NavigatorSearchFilterType, string, string][] = [
    [NavigatorSearchFilterType.Anything, 'navigator.filter.anything', 'Anything'],
    [NavigatorSearchFilterType.RoomName, 'navigator.filter.room.name', 'Room name'],
    [NavigatorSearchFilterType.Owner, 'navigator.filter.owner', 'Owner'],
    [NavigatorSearchFilterType.Tag, 'navigator.filter.tag', 'Tag'],
    [NavigatorSearchFilterType.Group, 'navigator.filter.group', 'Group']
];

/** `refreshButton` is a shiny button tinted 0x7cc561. */
const REFRESH_BUTTON_COLOR = '#7cc561';

/** `SearchView` - the filter dropdown, the text box and the refresh button. */
export const NavigatorSearchView = () => {
    const { filteringData, filterType, filterText } = useNavigatorSelectors();
    const { searchWithFilter, refresh } = useNavigatorSearch();
    const [isOpen, setIsOpen] = useState(false);
    const [value, setValue] = useState(filterText);
    const [type, setType] = useState(filterType);
    const [lastFilteringData, setLastFilteringData] = useState(filteringData);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const t = useTranslation();

    useOutsideClick(containerRef, () => setIsOpen(false), isOpen);

    // a quick link or a drill-down changes the running filter behind our back, so
    // the box resyncs whenever the server echoes back a different one - adjusting
    // during render rather than in an effect keeps typing from being clobbered
    if (lastFilteringData !== filteringData) {
        setLastFilteringData(filteringData);
        setValue(filterText);
        setType(filterType);
    }

    const submit = () => searchWithFilter(type, value);

    const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key !== 'Enter') return;

        submit();
    };

    const clear = () => {
        setValue('');
        inputRef.current?.focus();

        if (!filterText.length) return;

        searchWithFilter(type, '');
    };

    const label = FILTER_OPTIONS.find(x => x[0] === type) ?? FILTER_OPTIONS[0];
    // `setTextAndSearchModeFromFilter` only reveals refreshButtonContainer once
    // there is something to re-run, and swaps the pen out for a cross
    const hasFilter = value.length > 0;

    return (
        <div className="navigator-search-tools">
            <div ref={containerRef}>
                <Dropmenu variant="0" className="navigator-filter-menu" onClick={() => setIsOpen(x => !x)}>
                    <span className="block truncate">{t(label[1], label[2])}</span>
                </Dropmenu>
                {isOpen && (
                    <Border variant="0" className="navigator-filter-list p-0.5">
                        {FILTER_OPTIONS.map(([optionType, key, fallback]) => (
                            <DropmenuItem
                                key={optionType}
                                variant="0"
                                aria-selected={optionType === type}
                                className="navigator-filter-item"
                                onClick={() => {
                                    setType(optionType);
                                    setIsOpen(false);
                                    searchWithFilter(optionType, value);
                                }}>
                                {t(key, fallback)}
                            </DropmenuItem>
                        ))}
                    </Border>
                )}
            </div>
            <Border variant="4" className="navigator-search-field">
                <input
                    ref={inputRef}
                    type="text"
                    className="navigator-search-input"
                    aria-label={t('navigator.filter.input.placeholder', 'filter rooms by...')}
                    placeholder={t('navigator.filter.input.placeholder', 'filter rooms by...')}
                    value={value}
                    onChange={event => setValue(event.target.value)}
                    onKeyDown={onKeyDown}
                />
                <button
                    type="button"
                    className="navigator-search-clear"
                    aria-label={t('navigator.tooltip.filter.input', 'Clear')}
                    onClick={clear}>
                    <NitroIcon icon={hasFilter ? 'icon-nav-close' : 'icon-nav-small-pen'} />
                </button>
            </Border>
            {hasFilter && (
                <Button
                    variant="5"
                    tintColor={REFRESH_BUTTON_COLOR}
                    className="navigator-refresh"
                    aria-label={t('navigator.refresh', 'Refresh')}
                    onClick={refresh}>
                    <NitroIcon icon="icon-nav-refresh" />
                </Button>
            )}
        </div>
    );
}
