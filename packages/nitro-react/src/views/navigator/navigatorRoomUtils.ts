import { RoomDoorModeEnum } from '@nitrodevco/nitro-api';
import type { IRoomInfo } from '@nitrodevco/nitro-packets';

/** `newnavigator_default_room` - the same 110x110 bitmap flash falls back to. */
export const NAVIGATOR_ROOM_THUMBNAIL_PLACEHOLDER = '/assets/flash/navigator/default_room.png';

/** `RoomEntryUtils.getDoorModeIconAsset` - open doors get no marker at all. */
export const GetDoorModeIcon = (doorMode: RoomDoorModeEnum) => {
    switch (doorMode) {
        case RoomDoorModeEnum.Locked: return 'icon-navigator-room-locked';
        case RoomDoorModeEnum.Password: return 'icon-navigator-room-password';
        case RoomDoorModeEnum.Invisible: return 'icon-navigator-room-invisible';
        default: return '';
    }
}

/**
 * `HabboWindowUtils.getUserCountColor` - the pill is tinted by how full the room
 * is. 80% and 50% return the same amber in the flash client.
 */
export const GetUserCountColor = (population: number, playersMax: number) => {
    const percentage = playersMax > 0 ? 100 * (population / playersMax) : 0;

    if (percentage >= 92) return '#c2332c';

    if (percentage >= 50) return '#ffb11b';

    if (population > 0) return '#63b162';

    return '#cbcac1';
}

/**
 * `RoomEntryUtils.getModulatedBackgroundColor` multiplies the row's white by
 * 0x8f9fff, clamped at 1.5x a channel, which lands on this blue. The first row
 * of a category is the tinted one.
 */
export const NAVIGATOR_ROW_COLORS = ['#d6eeff', '#ffffff'];

/** `navigator_entry_tile` carries this tint on its drop shadow border. */
export const NAVIGATOR_TILE_COLOR = '#ebe9df';

/**
 * Official rooms carry their own art; everything else falls back to the shared
 * placeholder unless the hotel configures a per room thumbnail endpoint.
 */
export const GetRoomThumbnailUrl = (roomInfo: IRoomInfo, thumbnailUrl?: string) => {
    if (roomInfo.officialRoomPicRef && roomInfo.officialRoomPicRef.length) return roomInfo.officialRoomPicRef;

    if (thumbnailUrl && thumbnailUrl.length) return thumbnailUrl.replace('%roomId%', String(roomInfo.roomId));

    return NAVIGATOR_ROOM_THUMBNAIL_PLACEHOLDER;
}

/** Group badges only render once the hotel points `badge.asset.url` somewhere. */
export const GetGroupBadgeUrl = (badgeCode: string, badgeUrl?: string) => {
    if (!badgeCode || !badgeCode.length || !badgeUrl || !badgeUrl.length) return '';

    return badgeUrl.replace('%badgename%', badgeCode);
}

/** Floor plan thumbnails live next to the models the creator offers. */
export const GetRoomModelImageUrl = (name: string) => `/assets/flash/navigator/models/${name}.png`;
