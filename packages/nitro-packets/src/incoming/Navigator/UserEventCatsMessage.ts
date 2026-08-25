import type { IIncomingPacket, IMessageDataWrapper } from '@nitrodevco/nitro-api';

import type { INavigatorEventCategory } from './Data/NavigatorCategoryParser';
import { NavigatorEventCategoryParser } from './Data/NavigatorCategoryParser';

export type UserEventCatsMessageType = {
    eventCategories: INavigatorEventCategory[];
};

export class UserEventCatsMessage implements IIncomingPacket<UserEventCatsMessageType> {
    public parse(wrapper: IMessageDataWrapper): UserEventCatsMessageType {
        const eventCategories: INavigatorEventCategory[] = [];

        // the server may answer with an empty body while no categories are configured
        if (!wrapper.bytesAvailable) return { eventCategories };

        let count = wrapper.readInt();

        while (count > 0) {
            eventCategories.push(NavigatorEventCategoryParser(wrapper));

            count--;
        }

        return { eventCategories };
    }
}
