import type { IIncomingPacket, IMessageDataWrapper } from '@nitrodevco/nitro-api';

import type { INavigatorFlatCategory } from './Data/NavigatorCategoryParser';
import { NavigatorFlatCategoryParser } from './Data/NavigatorCategoryParser';

export type UserFlatCatsMessageType = {
    nodes: INavigatorFlatCategory[];
};

export class UserFlatCatsMessage implements IIncomingPacket<UserFlatCatsMessageType> {
    public parse(wrapper: IMessageDataWrapper): UserFlatCatsMessageType {
        const nodes: INavigatorFlatCategory[] = [];

        // the server may answer with an empty body while no categories are configured
        if (!wrapper.bytesAvailable) return { nodes };

        let count = wrapper.readInt();

        while (count > 0) {
            nodes.push(NavigatorFlatCategoryParser(wrapper));

            count--;
        }

        return { nodes };
    }
}
