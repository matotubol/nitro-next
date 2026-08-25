import { ClubLevelEnum } from '@nitrodevco/nitro-api';
import { useMemo } from 'react';

import { useConfigValue } from '#base/context';

export type NavigatorRoomModel = {
    /** `flatModelName` on the wire, and the thumbnail file name. */
    name: string;
    tileSize: number;
    clubLevel: ClubLevelEnum;
}

/**
 * The flash client ships the floor plan list with the swf rather than fetching it,
 * so the same fixed set lives here. `navigator.room.models` in nitro-config can
 * replace it wholesale when a hotel runs custom layouts.
 */
const DEFAULT_ROOM_MODELS: NavigatorRoomModel[] = [
    { name: 'model_a', tileSize: 50, clubLevel: ClubLevelEnum.None },
    { name: 'model_b', tileSize: 50, clubLevel: ClubLevelEnum.None },
    { name: 'model_c', tileSize: 50, clubLevel: ClubLevelEnum.None },
    { name: 'model_d', tileSize: 50, clubLevel: ClubLevelEnum.None },
    { name: 'model_e', tileSize: 50, clubLevel: ClubLevelEnum.None },
    { name: 'model_f', tileSize: 50, clubLevel: ClubLevelEnum.None },
    { name: 'model_g', tileSize: 100, clubLevel: ClubLevelEnum.None },
    { name: 'model_h', tileSize: 100, clubLevel: ClubLevelEnum.None },
    { name: 'model_i', tileSize: 100, clubLevel: ClubLevelEnum.None },
    { name: 'model_j', tileSize: 100, clubLevel: ClubLevelEnum.None },
    { name: 'model_k', tileSize: 200, clubLevel: ClubLevelEnum.None },
    { name: 'model_l', tileSize: 200, clubLevel: ClubLevelEnum.None },
    { name: 'model_m', tileSize: 200, clubLevel: ClubLevelEnum.None },
    { name: 'model_n', tileSize: 250, clubLevel: ClubLevelEnum.Club },
    { name: 'model_o', tileSize: 250, clubLevel: ClubLevelEnum.Club },
    { name: 'model_p', tileSize: 250, clubLevel: ClubLevelEnum.Club },
    { name: 'model_q', tileSize: 300, clubLevel: ClubLevelEnum.Club },
    { name: 'model_r', tileSize: 300, clubLevel: ClubLevelEnum.Club },
    { name: 'model_t', tileSize: 350, clubLevel: ClubLevelEnum.Club },
    { name: 'model_u', tileSize: 350, clubLevel: ClubLevelEnum.Club },
    { name: 'model_v', tileSize: 400, clubLevel: ClubLevelEnum.Club },
    { name: 'model_w', tileSize: 400, clubLevel: ClubLevelEnum.Club },
    { name: 'model_x', tileSize: 450, clubLevel: ClubLevelEnum.Club },
    { name: 'model_y', tileSize: 450, clubLevel: ClubLevelEnum.Club },
    { name: 'model_z', tileSize: 500, clubLevel: ClubLevelEnum.Club }
];

export const useNavigatorRoomModels = () => {
    const configured = useConfigValue<NavigatorRoomModel[]>('navigator.room.models');

    return useMemo(() => (configured?.length ? configured : DEFAULT_ROOM_MODELS), [configured]);
}
