import { IPurchasableOffer } from '@nitrodevco/nitro-api';

export type CatalogPriceEntry =
    | { kind: 'credits'; amount: number }
    | { kind: 'activityPoints'; amount: number; activityPointType: number }
    | { kind: 'silver'; amount: number };

export const getCatalogOfferPriceEntries = (
    offer: IPurchasableOffer,
    quantity: number = 1,
): CatalogPriceEntry[] => {
    const multiplier = Math.max(1, quantity);
    const prices: CatalogPriceEntry[] = [];

    if (offer.priceInCredits > 0)
        prices.push({ kind: 'credits', amount: offer.priceInCredits * multiplier });

    if (offer.priceInActivityPoints > 0)
        prices.push({
            kind: 'activityPoints',
            amount: offer.priceInActivityPoints * multiplier,
            activityPointType: offer.activityPointType,
        });

    if (offer.priceInSilver > 0)
        prices.push({ kind: 'silver', amount: offer.priceInSilver * multiplier });

    return prices;
};

export const getCatalogPriceIcon = (
    price: CatalogPriceEntry,
    size: 'small' | 'big' = 'small',
) => {
    if (price.kind === 'credits') return `habbo-icon icon-credit-${size}`;
    if (price.kind === 'silver') return `habbo-icon icon-silver-${size}`;
    if (price.activityPointType === 0) return `habbo-icon icon-ducket-${size}`;
    if (price.activityPointType === 5) return `habbo-icon icon-diamond-${size}`;

    return `habbo-icon icon-loyalty-${size}`;
};
