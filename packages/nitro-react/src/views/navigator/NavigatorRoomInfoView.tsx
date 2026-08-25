import { NavigatorSearchFilterType, RoomTradeModeEnum } from '@nitrodevco/nitro-api';
import { GetRoomSettingsComposer } from '@nitrodevco/nitro-packets';
import { useEffect, useRef, useState } from 'react';

import {
    useConfigValue,
    useNavigatorActions,
    useNavigatorInfoRoom,
    useNavigatorInfoRoomAnchor,
    useOwnIsModerator,
    useOwnUserId,
    useTranslation,
    useWebSocketContext
} from '#base/context';
import { useNavigatorRoomActions, useNavigatorSearch } from '#base/hooks';
import { Border, BubblePointer, NitroIcon } from '#base/theme';

import {
    GetGroupBadgeUrl,
    GetRoomThumbnailUrl,
    NAVIGATOR_ROOM_THUMBNAIL_PLACEHOLDER
} from './navigatorRoomUtils';

/** The bubble is 374 wide; `main_content` is 345 of it. */
const BUBBLE_WIDTH = 374;

/** `NavigatorView.POPUP_HIDE_DELAY_MS` */
const POPUP_HIDE_DELAY_MS = 4000;

/** `<border name="event_info" color="0x0f1a700">` */
const EVENT_COLOR = '#f1a700';

/** `RoomTradingLevelEnum.getLocalizationKey` */
const TRADE_MODE_KEYS: Record<number, string> = {
    [RoomTradeModeEnum.Disabled]: 'navigator.roomsettings.trade_not_allowed',
    [RoomTradeModeEnum.RoomOwnerAndRights]: 'navigator.roomsettings.trade_not_with_Controller',
    [RoomTradeModeEnum.Everyone]: 'navigator.roomsettings.trade_allowed'
};

/**
 * `RoomInfoPopup` - the ubuntu bubble that hangs off a result entry, laid out
 * exactly as room_info_popup_bubble_xml: a 112px thumbnail beside the name and
 * description, then owner/group, then the properties list beside the toggles,
 * then the tags and the room ad.
 */
export const NavigatorRoomInfoView = () => {
    const roomInfo = useNavigatorInfoRoom();
    const anchor = useNavigatorInfoRoomAnchor();
    const { setInfoRoom } = useNavigatorActions();
    const { isFavourite, toggleFavourite, toggleHomeRoom, toggleStaffPick, homeRoomId } = useNavigatorRoomActions();
    const { searchWithFilter } = useNavigatorSearch();
    const thumbnailUrl = useConfigValue<string>('navigator.room.thumbnail.url');
    const badgeUrl = useConfigValue<string>('badge.asset.url');
    const isModerator = useOwnIsModerator();
    const ownUserId = useOwnUserId();
    const { send } = useWebSocketContext();
    const t = useTranslation();
    const isHoveredRef = useRef(false);
    const [hasExpired, setHasExpired] = useState(false);
    const [lastAnchor, setLastAnchor] = useState(anchor);

    // every open hands us a fresh anchor, so that is what restarts the countdown
    if (lastAnchor !== anchor) {
        setLastAnchor(anchor);
        setHasExpired(false);
    }

    // `NavigatorView.update` counts the bubble down from four seconds and drops it
    // the moment the pointer is not inside it any more
    useEffect(() => {
        if (!roomInfo) return;

        const timeout = window.setTimeout(() => {
            if (isHoveredRef.current) {
                setHasExpired(true);

                return;
            }

            setInfoRoom(undefined);
        }, POPUP_HIDE_DELAY_MS);

        return () => window.clearTimeout(timeout);
    }, [anchor, roomInfo, setInfoRoom]);

    if (!roomInfo) return null;

    const isHome = homeRoomId === roomInfo.roomId;
    const favourite = isFavourite(roomInfo.roomId);
    const badgeSrc = GetGroupBadgeUrl(roomInfo.groupBadge, badgeUrl);
    const hasGroup = roomInfo.groupBadge.length > 0;
    const hasEvent = roomInfo.adExpiresIn > 0;

    // `showAt` drops the bubble at the anchor and centres it on that point
    const left = anchor ? Math.min(anchor.x, window.innerWidth - BUBBLE_WIDTH - 4) : 12;
    const top = anchor ? anchor.y : 120;

    return (
        <div
            className="navigator-room-info"
            style={{ left, top }}
            onPointerEnter={() => { isHoveredRef.current = true; }}
            onPointerLeave={() => {
                isHoveredRef.current = false;

                if (hasExpired) setInfoRoom(undefined);
            }}>
            <BubblePointer direction="left" defaultVariant="7" />
            <div className="navigator-room-info-bubble">
                <div className="navigator-room-info-content">
                    <Border variant="2" className="navigator-room-info-header">
                        <div className="navigator-room-info-thumb">
                            <img
                                src={GetRoomThumbnailUrl(roomInfo, thumbnailUrl)}
                                alt=""
                                onError={event => { event.currentTarget.src = NAVIGATOR_ROOM_THUMBNAIL_PLACEHOLDER; }}
                            />
                        </div>
                        {badgeSrc.length > 0 && (
                            <div className="navigator-room-info-badge">
                                <img src={badgeSrc} alt="" onError={event => { event.currentTarget.style.display = 'none'; }} />
                            </div>
                        )}
                        <div className="navigator-room-info-name">{roomInfo.name}</div>
                        <div className="navigator-room-info-desc">{roomInfo.description}</div>
                    </Border>
                    {(roomInfo.showOwner || hasGroup) && (
                        <div className="navigator-room-info-people">
                            {roomInfo.showOwner && (
                                <div className="navigator-room-info-owner">
                                    <div className="navigator-room-info-people-icon is-owner" />
                                    <div className="navigator-room-info-people-name">{roomInfo.ownerName}</div>
                                </div>
                            )}
                            {hasGroup && (
                                <div className="navigator-room-info-group">
                                    <div className="navigator-room-info-people-icon is-group" />
                                    <div className="navigator-room-info-people-name">{roomInfo.groupName}</div>
                                </div>
                            )}
                        </div>
                    )}
                    <div className="navigator-room-info-mid">
                        <div className="navigator-room-info-properties">
                            <div className="navigator-room-info-property">
                                <div className="navigator-room-info-property-name">{t('navigator.roompopup.property.trading', 'Trading')}</div>
                                <div className="navigator-room-info-property-value">
                                    {t(TRADE_MODE_KEYS[roomInfo.tradeType] ?? TRADE_MODE_KEYS[RoomTradeModeEnum.Disabled], String(roomInfo.tradeType))}
                                </div>
                            </div>
                            <div className="navigator-room-info-property">
                                <div className="navigator-room-info-property-name">{t('navigator.roompopup.property.ranking', 'Ranking')}</div>
                                <div className="navigator-room-info-property-value">{roomInfo.ranking}</div>
                            </div>
                            <div className="navigator-room-info-property">
                                <div className="navigator-room-info-property-name">{t('navigator.roompopup.property.max_users', 'Max. visitors')}</div>
                                <div className="navigator-room-info-property-value">{roomInfo.playersMax}</div>
                            </div>
                        </div>
                        <div className="navigator-room-info-toggles">
                            <button
                                type="button"
                                className="navigator-room-info-toggle"
                                onClick={() => toggleFavourite(roomInfo.roomId)}>
                                <NitroIcon
                                    icon={favourite ? 'icon-nav-favourite-on' : 'icon-nav-favourite-off'}
                                    className="navigator-room-info-toggle-icon"
                                />
                                <div className="navigator-room-info-toggle-label">
                                    {t('navigator.room.popup.room.info.favorite', 'Favourite')}
                                </div>
                            </button>
                            <button
                                type="button"
                                className="navigator-room-info-toggle"
                                onClick={() => toggleHomeRoom(roomInfo.roomId)}>
                                <NitroIcon
                                    icon={isHome ? 'icon-nav-home-on' : 'icon-nav-home-off'}
                                    className="navigator-room-info-toggle-icon"
                                />
                                <div className="navigator-room-info-toggle-label">
                                    {t('navigator.room.popup.room.info.home', 'Home room')}
                                </div>
                            </button>
                            {roomInfo.ownerId === ownUserId && (
                                <button
                                    type="button"
                                    className="navigator-room-info-toggle"
                                    onClick={() => {
                                        setInfoRoom(undefined);
                                        send(new GetRoomSettingsComposer({ roomId: roomInfo.roomId }));
                                    }}>
                                    <NitroIcon icon="icon-nav-room-settings" className="navigator-room-info-toggle-icon" />
                                    <div className="navigator-room-info-toggle-label">
                                        {t('navigator.room.popup.info.room.settings', 'Room settings')}
                                    </div>
                                </button>
                            )}
                            {isModerator && (
                                <button
                                    type="button"
                                    className="navigator-room-info-toggle"
                                    onClick={() => toggleStaffPick(roomInfo.roomId, true)}>
                                    <NitroIcon icon="icon-nav-room-settings" className="navigator-room-info-toggle-icon" />
                                    <div className="navigator-room-info-toggle-label">
                                        {t('navigator.staffpick.add', 'Staff pick')}
                                    </div>
                                </button>
                            )}
                        </div>
                    </div>
                    {roomInfo.tags.length > 0 && (
                        <div className="navigator-room-info-bottom">
                            <div className="navigator-room-info-tags">
                                {roomInfo.tags.map(tag => (
                                    <span
                                        key={tag}
                                        className="navigator-room-info-tag"
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => {
                                            setInfoRoom(undefined);
                                            searchWithFilter(NavigatorSearchFilterType.Tag, tag);
                                        }}>
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    {hasEvent && (
                        <Border variant="3" tintColor={EVENT_COLOR} className="navigator-room-info-event">
                            <NitroIcon icon="icon-nav-event" className="navigator-room-info-event-icon" />
                            <div className="navigator-room-info-event-name">
                                {t('navigator.eventsettings.name', 'Event')}: {roomInfo.adName}
                            </div>
                            <div className="navigator-room-info-event-desc">
                                {t('navigator.eventsettings.desc', 'Description')}: {roomInfo.adDescription}
                            </div>
                        </Border>
                    )}
                </div>
            </div>
        </div>
    );
}
