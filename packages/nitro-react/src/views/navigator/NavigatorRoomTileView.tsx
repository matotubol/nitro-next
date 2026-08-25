import type { IRoomInfo } from '@nitrodevco/nitro-packets';
import type { MouseEvent } from 'react';
import { memo } from 'react';

import { useConfigValue, useNavigatorActions } from '#base/context';
import { useNavigatorRoomEntry } from '#base/hooks';
import { Border, NitroIcon } from '#base/theme';

import {
    GetDoorModeIcon,
    GetGroupBadgeUrl,
    GetRoomThumbnailUrl,
    NAVIGATOR_ROOM_THUMBNAIL_PLACEHOLDER,
    NAVIGATOR_TILE_COLOR
} from './navigatorRoomUtils';
import { NavigatorUserCountView } from './NavigatorUserCountView';

type NavigatorRoomTileViewProps = {
    roomInfo: IRoomInfo;
}

/** `navigator_entry_tile` - the 122x146 thumbnail card. */
/** Memoised: a collapse or view-mode toggle re-renders the grid, not every card in it. */
export const NavigatorRoomTileView = memo(({ roomInfo }: NavigatorRoomTileViewProps) => {
    const { visitRoom } = useNavigatorRoomEntry();
    const { toggleInfoRoom } = useNavigatorActions();
    const thumbnailUrl = useConfigValue<string>('navigator.room.thumbnail.url');
    const badgeUrl = useConfigValue<string>('badge.asset.url');
    const doorIcon = GetDoorModeIcon(roomInfo.doorMode);
    const badgeSrc = GetGroupBadgeUrl(roomInfo.groupBadge, badgeUrl);

    const openInfo = (event: MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();

        const rect = event.currentTarget.getBoundingClientRect();

        // the tile variant drops the bubble 56px lower, as `onTileGoToRoomMouseOver` does
        toggleInfoRoom(roomInfo, { x: rect.right - 6, y: rect.top + rect.height / 2 + 56 });
    };

    return (
        <Border
            variant="10"
            tintColor={NAVIGATOR_TILE_COLOR}
            className="navigator-tile"
            role="button"
            tabIndex={0}
            title={roomInfo.name}
            onClick={() => visitRoom(roomInfo)}>
            <div className="navigator-tile-image" />
            <div className="navigator-tile-thumb">
                <img
                    src={GetRoomThumbnailUrl(roomInfo, thumbnailUrl)}
                    alt=""
                    onError={event => { event.currentTarget.src = NAVIGATOR_ROOM_THUMBNAIL_PLACEHOLDER; }}
                />
            </div>
            {badgeSrc.length > 0 && (
                <div className="navigator-tile-badge">
                    <img src={badgeSrc} alt="" onError={event => { event.currentTarget.style.display = 'none'; }} />
                </div>
            )}
            <NavigatorUserCountView
                className="navigator-tile-usercount"
                population={roomInfo.population}
                playersMax={roomInfo.playersMax}
            />
            {doorIcon.length > 0 && (
                <div className="navigator-tile-doormode">
                    <NitroIcon icon={doorIcon} />
                </div>
            )}
            <div className="navigator-tile-name">{roomInfo.name}</div>
            <button type="button" className="navigator-tile-info" aria-label={roomInfo.name} onClick={openInfo}>
                <NitroIcon icon="icon-navigator-info" />
            </button>
        </Border>
    );
});
