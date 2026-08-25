import type { IIncomingPacket, IMessageDataWrapper } from '@nitrodevco/nitro-api';

export interface ICategoryVisitorCount {
    categoryId: number;
    currentVisitors: number;
    maxVisitors: number;
}

export type CategoriesWithVisitorCountMessageType = {
    categories: ICategoryVisitorCount[];
};

export class CategoriesWithVisitorCountMessage implements IIncomingPacket<CategoriesWithVisitorCountMessageType> {
    public parse(wrapper: IMessageDataWrapper): CategoriesWithVisitorCountMessageType {
        const categories: ICategoryVisitorCount[] = [];

        let count = wrapper.readInt();

        while (count > 0) {
            categories.push({
                categoryId: wrapper.readInt(),
                currentVisitors: wrapper.readInt(),
                maxVisitors: wrapper.readInt()
            });

            count--;
        }

        return { categories };
    }
}
