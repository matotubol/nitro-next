import { Border, cn } from '#base/theme';

import { GetUserCountColor } from './navigatorRoomUtils';

type NavigatorUserCountViewProps = {
    population: number;
    playersMax: number;
    className?: string;
}

/**
 * `room_info_usercount_border` - a 40x18 border_slot pill tinted by how full the
 * room is, carrying the 13x14 head icon and the count.
 */
export const NavigatorUserCountView = ({ population, playersMax, className }: NavigatorUserCountViewProps) => (
    <Border variant="3" className={cn('navigator-usercount', className)} tintColor={GetUserCountColor(population, playersMax)}>
        <div className="navigator-usercount-icon" />
        <div className="navigator-usercount-label">{population}</div>
    </Border>
);
