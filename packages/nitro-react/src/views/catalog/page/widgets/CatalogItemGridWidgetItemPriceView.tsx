import { IPurchasableOffer } from '@nitrodevco/nitro-api';

import { BitmapText, NitroIcon } from '#base/theme';

import {
    getCatalogOfferPriceEntries,
    getCatalogPriceIcon,
} from './catalogPriceUtilities';

type CatalogItemGridWidgetItemPriceViewProps = {
    offer: IPurchasableOffer;
};

type PriceLineProps = {
    amount: number;
    icon: string;
    single: boolean;
    top: number;
    plus?: boolean;
};

const PriceLine = (props: PriceLineProps) => {
    const { amount, icon, single, top, plus = false } = props;

    return (
        <div className="catalog-grid-price-line" style={{ top }}>
            {plus && (
                <BitmapText
                    recipe="bold-12"
                    color="#000000"
                    align="center"
                    className="catalog-grid-price-text catalog-grid-price-plus"
                >
                    +
                </BitmapText>
            )}
            <BitmapText
                recipe="bold-12"
                color="#000000"
                align="center"
                autoWidth
                className="catalog-grid-price-text"
            >
                {amount}
            </BitmapText>
            <span className={`catalog-grid-price-icon${single ? ' is-single' : ''}`}>
                <NitroIcon icon={icon} aria-hidden="true" />
            </span>
        </div>
    );
};

export const CatalogItemGridWidgetItemPriceView = (
    props: CatalogItemGridWidgetItemPriceViewProps,
) => {
    const { offer } = props;
    const prices = getCatalogOfferPriceEntries(offer);

    if (!prices.length) return null;

    return prices.map((price, index) => (
        <PriceLine
            key={
                price.kind === 'activityPoints'
                    ? `${price.kind}-${price.activityPointType}`
                    : price.kind
            }
            amount={price.amount}
            icon={getCatalogPriceIcon(price)}
            single={prices.length === 1}
            top={36 + index * 15}
            plus={index > 0}
        />
    ));
};
