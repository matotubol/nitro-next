import type { IRoomInfo } from '@nitrodevco/nitro-packets';
import type { MouseEvent } from 'react';
import { memo } from 'react';

import { useNavigatorActions } from '#base/context';
import { useNavigatorRoomEntry } from '#base/hooks';
import { Border, NitroIcon } from '#base/theme';

import { GetDoorModeIcon, NAVIGATOR_ROW_COLORS } from './navigatorRoomUtils';
import { NavigatorUserCountView } from './NavigatorUserCountView';

type NavigatorRoomRowViewProps = {
    roomInfo: IRoomInfo;
    index: number;
}

/** `navigator_entry_row_container` - the 383x20 one line result. */
/** Memoised: a collapse or view-mode toggle re-renders the list, not every row in it. */
export const NavigatorRoomRowView = memo(({ roomInfo, index }: NavigatorRoomRowViewProps) => {
    const { visitRoom } = useNavigatorRoomEntry();
    const { toggleInfoRoom } = useNavigatorActions();
    const doorIcon = GetDoorModeIcon(roomInfo.doorMode);

    const openInfo = (event: MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();

        const rect = event.currentTarget.getBoundingClientRect();

        // RoomEntryElementFactory opens the bubble 20px right of the row and
        // vertically centred on the button it was clicked from
        toggleInfoRoom(roomInfo, { x: rect.right + 20, y: rect.top + rect.height / 2 });
    };

    return (
        <Border
            variant="3"
            tintColor={NAVIGATOR_ROW_COLORS[index % NAVIGATOR_ROW_COLORS.length]}
            className="navigator-row"
            role="button"
            tabIndex={0}
            title={roomInfo.name}
            onClick={() => visitRoom(roomInfo)}>
            <div className="navigator-row-inner">
                <NavigatorUserCountView
                    className="navigator-row-usercount"
                    population={roomInfo.population}
                    playersMax={roomInfo.playersMax}
                />
                <div className="navigator-row-name">{roomInfo.name}</div>
                {doorIcon.length > 0 && (
                    <div className="navigator-row-doormode">
                        <NitroIcon icon={doorIcon} />
                    </div>
                )}
                {roomInfo.groupBadge.length > 0 && (
                    <div className="navigator-row-group">
                        <NitroIcon icon="icon-navigator-room-group" />
                    </div>
                )}
                <button
                    type="button"
                    className="navigator-row-info"
                    aria-label={roomInfo.name}
                    onClick={openInfo}>
                    <NitroIcon icon="icon-navigator-info" />
                </button>
            </div>
        </Border>
    );
});
