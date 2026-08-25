import type { IOutgoingPacket } from '@nitrodevco/nitro-api';
import { RoomObjectCategoryEnum } from '@nitrodevco/nitro-api';

export type PickupObjectComposerType = {
    category: RoomObjectCategoryEnum;
    objectId: number;
    confirm: boolean;
};

/**
 * The wire carries its own two-value category, not the room object category the
 * engine works in - `getMessageArray` maps floor to 2 and wall to 1, and refuses
 * to build a packet for anything else.
 */
const CATEGORY_CODES: Partial<Record<RoomObjectCategoryEnum, number>> = {
    [RoomObjectCategoryEnum.Floor]: 2,
    [RoomObjectCategoryEnum.Wall]: 1
};

export class PickupObjectComposer implements IOutgoingPacket<PickupObjectComposerType> {
    public constructor(private params: PickupObjectComposerType) { }

    public compose(): (number | string | boolean)[] {
        const categoryCode = CATEGORY_CODES[this.params.category];

        if (categoryCode === undefined) return [];

        return [
            categoryCode,
            this.params.objectId,
            this.params.confirm,
        ];
    }
}
