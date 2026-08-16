import { IPurchasableOffer } from '@nitrodevco/nitro-api';

import { useTranslation } from '#base/context';
import { useCatalogOfferProduct, useProductIconUrl } from '#base/hooks';
import {
    BitmapText,
    Border,
    Button,
    ButtonThick,
    Frame,
    Image,
    NitroIcon,
} from '#base/theme';

import type { CatalogPriceEntry } from './catalogPriceUtilities';
import {
    getCatalogOfferPriceEntries,
    getCatalogPriceIcon,
} from './catalogPriceUtilities';

type CatalogPurchaseConfirmationViewProps = {
    offer: IPurchasableOffer;
    isPending: boolean;
    onConfirm: () => void;
    onClose: () => void;
};

export const CatalogPurchaseConfirmationView = (
    props: CatalogPurchaseConfirmationViewProps,
) => {
    const { offer, isPending, onConfirm, onClose } = props;
    const product = useCatalogOfferProduct(offer);
    const productIconUrl = useProductIconUrl(product!);
    const prices = getCatalogOfferPriceEntries(offer);
    const displayPrices: CatalogPriceEntry[] = prices.length
        ? prices
        : [{ kind: 'credits', amount: 0 }];
    const t = useTranslation();
    const productName =
        product?.productData?.name ||
        product?.furnitureData.localizedName ||
        offer.localizationId;
    const buyCaption = offer.isRentOffer
        ? t('catalog.purchase_confirmation.rent', 'Rent')
        : t('catalog.purchase_confirmation.buy', 'Buy');

    return (
        <Frame
            variant="3"
            tintColor="#418db0"
            className="catalog-purchase-confirmation"
            contentClassName="p-0!"
            caption={t('catalog.purchase_confirmation.title', 'Confirm purchase')}
            captionTextRecipe="bold-12"
            captionTextColor="#ffffff"
            onClose={() => !isPending && onClose()}
        >
            <div className="catalog-purchase-confirmation-content">
                <div className="catalog-purchase-confirmation-product">
                    <Border variant="0" className="catalog-purchase-confirmation-image">
                        <Image
                            src={productIconUrl}
                            className="max-h-full max-w-full pixel-art"
                        />
                    </Border>
                    <div className="catalog-purchase-confirmation-properties">
                        <BitmapText
                            recipe="bold-14"
                            color="#000000"
                            wrap
                            lineHeight={17}
                            className="catalog-purchase-confirmation-name"
                        >
                            {productName}
                        </BitmapText>
                        <div className="catalog-purchase-confirmation-cost">
                            <span className="catalog-purchase-confirmation-cost-label">
                                {t(
                                    'catalog.purchase.confirmation.dialog.cost',
                                    'Cost:',
                                )}
                            </span>
                            <span className="catalog-purchase-confirmation-prices">
                                {displayPrices.map((price, index) => (
                                    <span
                                        key={
                                            price.kind === 'activityPoints'
                                                ? `${price.kind}-${price.activityPointType}`
                                                : price.kind
                                        }
                                        className="catalog-purchase-confirmation-price"
                                    >
                                        <BitmapText
                                            recipe="bold-14"
                                            color="#000000"
                                            autoWidth
                                            className="catalog-purchase-confirmation-price-amount"
                                        >
                                            {`${index > 0 ? '+ ' : ''}${price.amount}`}
                                        </BitmapText>
                                        <span className="catalog-purchase-confirmation-price-icon">
                                            <NitroIcon
                                                icon={getCatalogPriceIcon(price, 'big')}
                                                aria-hidden="true"
                                            />
                                        </span>
                                    </span>
                                ))}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="catalog-purchase-confirmation-buttons">
                    <Button
                        variant="3"
                        className="catalog-purchase-confirmation-button"
                        disabled={isPending}
                        onClick={onClose}
                    >
                        <BitmapText
                            recipe="regular-12"
                            color="#000000"
                            align="center"
                            className="catalog-purchase-confirmation-button-label"
                        >
                            {t('catalog.purchase_confirmation.cancel', 'Cancel')}
                        </BitmapText>
                    </Button>
                    <ButtonThick
                        variant="6"
                        className="catalog-purchase-confirmation-button"
                        disabled={isPending}
                        onClick={onConfirm}
                    >
                        <BitmapText
                            recipe="bold-12"
                            color="#ffffff"
                            align="center"
                            className="catalog-purchase-confirmation-button-label"
                        >
                            {isPending
                                ? t('generic.wait', 'Please wait...')
                                : buyCaption}
                        </BitmapText>
                    </ButtonThick>
                </div>
            </div>
        </Frame>
    );
};
