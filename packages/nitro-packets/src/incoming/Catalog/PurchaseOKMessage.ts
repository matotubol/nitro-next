import {
    ICatalogOffer,
    IIncomingPacket,
    IMessageDataWrapper,
} from '@nitrodevco/nitro-api';

import { PurchasedCatalogOfferParser } from './Data/PurchasedCatalogOfferParser';

export type PurchaseOKMessageType = {
    offer: ICatalogOffer;
};

export class PurchaseOKMessage implements IIncomingPacket<PurchaseOKMessageType> {
    public parse(wrapper: IMessageDataWrapper): PurchaseOKMessageType {
        return {
            offer: PurchasedCatalogOfferParser(wrapper),
        };
    }
}
