import { IIncomingPacket, IMessageDataWrapper } from '@nitrodevco/nitro-api';

export type WardrobeMessageType = {
    state: number;
    outfits: WardrobeOutfit[];
};

export type WardrobeOutfit = {
    slotId: number;
    figure: string;
    gender: string;
};

const MAX_WARDROBE_OUTFITS_PER_PACKET = 100;

export class WardrobeMessage implements IIncomingPacket<WardrobeMessageType> {
    public parse(wrapper: IMessageDataWrapper): WardrobeMessageType {
        const state = wrapper.readInt();
        const outfitCount = Math.min(
            MAX_WARDROBE_OUTFITS_PER_PACKET,
            Math.max(0, wrapper.readInt()),
        );
        const outfits: WardrobeOutfit[] = [];

        for (let index = 0; index < outfitCount; index++) {
            outfits.push({
                slotId: wrapper.readInt(),
                figure: wrapper.readString(),
                gender: wrapper.readString()?.toUpperCase(),
            });
        }

        const packet: WardrobeMessageType = { state, outfits };

        return packet;
    }
}
