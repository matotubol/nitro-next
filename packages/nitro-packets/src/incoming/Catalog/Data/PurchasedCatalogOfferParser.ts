import { ICatalogOffer, IMessageDataWrapper, ParseArray } from '@nitrodevco/nitro-api';

import { CatalogProductParser } from './CatalogProductParser';

// PurchaseOK uses Habbo's shorter purchased-offer structure. It deliberately
// omits the silver, unknown and preview fields present in CatalogPageMessage.
export const PurchasedCatalogOfferParser = (
    wrapper: IMessageDataWrapper,
): ICatalogOffer => ({
    id: wrapper.readInt(),
    localizationId: wrapper.readString(),
    rentable: wrapper.readBoolean(),
    costCredits: wrapper.readInt(),
    costCurrency: wrapper.readInt(),
    costCurrencyType: wrapper.readInt(),
    costSilver: 0,
    canGift: wrapper.readBoolean(),
    products: ParseArray(wrapper, CatalogProductParser),
    clubLevel: wrapper.readInt(),
    canBundle: wrapper.readBoolean(),
    unknown1: false,
    previewImage: '',
});
