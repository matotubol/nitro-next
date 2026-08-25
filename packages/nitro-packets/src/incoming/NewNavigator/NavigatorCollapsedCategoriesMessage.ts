import type { IIncomingPacket, IMessageDataWrapper } from '@nitrodevco/nitro-api';

export type NavigatorCollapsedCategoriesMessageType = {
    collapsedCategoryIds: string[];
};

export class NavigatorCollapsedCategoriesMessage implements IIncomingPacket<NavigatorCollapsedCategoriesMessageType> {
    public parse(wrapper: IMessageDataWrapper): NavigatorCollapsedCategoriesMessageType {
        const collapsedCategoryIds: string[] = [];

        let count = wrapper.readInt();

        while (count > 0) {
            collapsedCategoryIds.push(wrapper.readString());

            count--;
        }

        return { collapsedCategoryIds };
    }
}
