import { IIncomingPacket, IMessageDataWrapper } from '@nitrodevco/nitro-api';

export type FigureSetIdsEventMessageType = {
    figureSetIds: number[];
    boundFurnitureNames: string[];
};

const MAX_FIGURE_SET_IDS_PER_PACKET = 10_000;
const MAX_BOUND_FURNITURE_NAMES_PER_PACKET = 10_000;

export class FigureSetIdsEventMessage implements IIncomingPacket<FigureSetIdsEventMessageType> {
    public parse(wrapper: IMessageDataWrapper): FigureSetIdsEventMessageType {
        const figureSetCount = Math.max(0, wrapper.readInt());
        const figureSetIds: number[] = [];

        for (let index = 0; index < figureSetCount; index++) {
            const figureSetId = wrapper.readInt();

            if (figureSetIds.length < MAX_FIGURE_SET_IDS_PER_PACKET)
                figureSetIds.push(figureSetId);
        }

        const boundFurnitureCount = Math.max(0, wrapper.readInt());
        const boundFurnitureNames: string[] = [];

        for (let index = 0; index < boundFurnitureCount; index++) {
            const boundFurnitureName = wrapper.readString();

            if (boundFurnitureNames.length < MAX_BOUND_FURNITURE_NAMES_PER_PACKET)
                boundFurnitureNames.push(boundFurnitureName);
        }

        return { figureSetIds, boundFurnitureNames };
    }
}
