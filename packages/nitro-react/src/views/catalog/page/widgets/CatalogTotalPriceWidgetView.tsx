import type { IPurchasableOffer } from '@nitrodevco/nitro-api';

import { useTranslation } from '#base/context';
import { BitmapText, NitroIcon } from '#base/theme';

import {
    getCatalogOfferPriceEntries,
    getCatalogPriceIcon,
} from './catalogPriceUtilities';

type CatalogTotalPriceWidgetViewProps = {
    offer: IPurchasableOffer;
    quantity: number;
};

export const CatalogTotalPriceWidgetView = (
    props: CatalogTotalPriceWidgetViewProps,
) => {
    const { offer, quantity } = props;
    const prices = getCatalogOfferPriceEntries(offer, quantity);
    const t = useTranslation();

    return (
        <div className="catalog-total-price-widget">
            <BitmapText
                recipe="regular-12"
                color="#666666"
                className="catalog-total-price-label"
            >
                {t('catalog.bundlewidget.price', 'Price')}
            </BitmapText>
            <div className="catalog-total-price-list">
                {prices.map((price, index) => (
                    <span
                        key={
                            price.kind === 'activityPoints'
                                ? `${price.kind}-${price.activityPointType}`
                                : price.kind
                        }
                        className="catalog-total-price-entry"
                    >
                        {index > 0 && (
                            <BitmapText
                                recipe="bold-12"
                                color="#000000"
                                autoWidth
                                className="catalog-total-price-plus"
                            >
                                +
                            </BitmapText>
                        )}
                        <BitmapText
                            recipe="bold-12"
                            color="#000000"
                            autoWidth
                            className="catalog-total-price-amount"
                        >
                            {price.amount}
                        </BitmapText>
                        <span className="catalog-total-price-icon">
                            <NitroIcon
                                icon={getCatalogPriceIcon(price, 'big')}
                                aria-hidden="true"
                            />
                        </span>
                    </span>
                ))}
            </div>
        </div>
    );
};
