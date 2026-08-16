import type { IPurchasableOffer } from '@nitrodevco/nitro-api';
import {
    NotEnoughBalanceMessage,
    PurchaseErrorMessage,
    PurchaseFromCatalogComposer,
    PurchaseNotAllowedMessage,
    PurchaseOKMessage,
} from '@nitrodevco/nitro-packets';
import { useState } from 'react';
import { createPortal } from 'react-dom';

import {
    useCatalogSelectors,
    useOwnClubLevel,
    useTranslation,
    useUserContext,
    useWallet,
    useWebSocketContext,
} from '#base/context';
import { useMessageListener } from '#base/hooks';
import { BitmapText, Border, Button, ContainerButton } from '#base/theme';

import type { CatalogPriceEntry } from './catalogPriceUtilities';
import { getCatalogOfferPriceEntries } from './catalogPriceUtilities';
import type { CatalogPurchaseAlert } from './CatalogPurchaseAlertView';
import { CatalogPurchaseAlertView } from './CatalogPurchaseAlertView';
import { CatalogPurchaseConfirmationView } from './CatalogPurchaseConfirmationView';

export const CatalogPurchaseWidgetView = () => {
    const { activeOffer, activePage } = useCatalogSelectors();
    const wallet = useWallet();
    const ownClubLevel = useOwnClubLevel();
    const accountSafetyLocked = useUserContext(x => x.accountSafetyLocked);
    const { send } = useWebSocketContext();
    const t = useTranslation();
    const [confirmationOffer, setConfirmationOffer] = useState<IPurchasableOffer>();
    const [alert, setAlert] = useState<CatalogPurchaseAlert>();
    const [isPending, setIsPending] = useState(false);
    const portalTarget = typeof document === 'undefined' ? null : document.body;

    const getActivityPointName = (type: number) => {
        if (type === 0) return t('purse.duckets', 'Duckets');
        if (type === 5) return t('purse.diamonds', 'Diamonds');

        return t(`activitypoint.name.${type}`, `Currency ${type}`);
    };

    const getNotEnoughAlert = (price: CatalogPriceEntry): CatalogPurchaseAlert => {
        if (price.kind === 'credits') {
            return {
                title: t('catalog.alert.notenough.title', 'Not enough credits'),
                message: t(
                    'catalog.alert.notenough.credits.description',
                    'You do not have enough credits for this purchase.',
                ),
            };
        }

        const currencyName =
            price.kind === 'silver'
                ? t('purse.silver', 'Silver')
                : getActivityPointName(price.activityPointType);

        return {
            title: t(
                'catalog.alert.notenough.activitypoints.title',
                `Not enough ${currencyName}`,
                { currencyname: currencyName },
            ),
            message: t(
                'catalog.alert.notenough.activitypoints.description',
                `You do not have enough ${currencyName} for this purchase.`,
                { currencyname: currencyName },
            ),
        };
    };

    const getBalance = (price: CatalogPriceEntry) => {
        if (price.kind === 'credits') return wallet.credits;
        if (price.kind === 'silver') return wallet.silver;

        return wallet.activityPoints[price.activityPointType] ?? 0;
    };

    const closePurchase = () => {
        if (isPending) return;

        setConfirmationOffer(undefined);
    };

    const openPurchase = () => {
        if (!activeOffer || accountSafetyLocked) return;

        setAlert(undefined);

        if (Number(ownClubLevel) < activeOffer.clubLevel) {
            setAlert({
                title: t(
                    'catalog.alert.purchasenotallowed.title',
                    'Purchase not allowed',
                ),
                message: t(
                    'catalog.alert.purchasenotallowed.hc.description',
                    'You need Habbo Club to buy this item.',
                ),
            });
            return;
        }

        const shortage = getCatalogOfferPriceEntries(activeOffer).find(
            price => price.amount > getBalance(price),
        );

        if (shortage) {
            setAlert(getNotEnoughAlert(shortage));
            return;
        }

        setConfirmationOffer(activeOffer);
    };

    const confirmPurchase = () => {
        if (!confirmationOffer || isPending) return;

        const pageId = confirmationOffer.page?.pageId ?? activePage?.pageId ?? -1;

        if (pageId < 0) {
            setConfirmationOffer(undefined);
            setAlert({
                title: t('catalog.alert.purchaseerror.title', 'Purchase failed'),
                message: t(
                    'catalog.alert.purchaseerror.description',
                    'The purchase could not be completed.',
                ),
            });
            return;
        }

        setIsPending(true);
        send(
            new PurchaseFromCatalogComposer({
                pageId,
                offerId: confirmationOffer.offerId,
                extraParam: '',
                quantity: 1,
            }),
        );
    };

    useMessageListener(PurchaseOKMessage, data => {
        if (!isPending || confirmationOffer?.offerId !== data.offer.id) return;

        setIsPending(false);
        setConfirmationOffer(undefined);
    });

    useMessageListener(NotEnoughBalanceMessage, data => {
        if (!isPending) return;

        setIsPending(false);
        setConfirmationOffer(undefined);

        if (data.notEnoughCredits) {
            setAlert(getNotEnoughAlert({ kind: 'credits', amount: 0 }));
            return;
        }

        if (data.notEnoughActivityPoints) {
            setAlert(
                getNotEnoughAlert({
                    kind: 'activityPoints',
                    amount: 0,
                    activityPointType: data.activityPointType,
                }),
            );
        }
    });

    useMessageListener(PurchaseErrorMessage, data => {
        if (!isPending) return;

        const defaultMessage = t(
            'catalog.alert.purchaseerror.description',
            'The purchase could not be completed.',
        );

        setIsPending(false);
        setConfirmationOffer(undefined);
        setAlert({
            title: t('catalog.alert.purchaseerror.title', 'Purchase failed'),
            message:
                data.errorCode > 0
                    ? t(
                          `catalog.alert.purchaseerror.description.${data.errorCode}`,
                          defaultMessage,
                      )
                    : defaultMessage,
        });
    });

    useMessageListener(PurchaseNotAllowedMessage, data => {
        if (!isPending) return;

        setIsPending(false);
        setConfirmationOffer(undefined);
        setAlert({
            title: t('catalog.alert.purchasenotallowed.title', 'Purchase not allowed'),
            message:
                Number(data.errorType) === 1
                    ? t(
                          'catalog.alert.purchasenotallowed.hc.description',
                          'You need Habbo Club to buy this item.',
                      )
                    : t(
                          'catalog.alert.purchasenotallowed.unknown.description',
                          'This offer cannot be purchased.',
                      ),
        });
    });

    if (activeOffer) {
        const isSoldOut = activeOffer.products.some(
            product => product.isUnique && product.uniqueLeft <= 0,
        );
        const buyCaption = activeOffer.isRentOffer
            ? t('catalog.purchase_confirmation.rent', 'Rent')
            : t('catalog.purchase_confirmation.buy', 'Buy');

        return (
            <>
                <div className="catalog-purchase-buttons">
                    <Button
                        variant="3"
                        type="button"
                        className="catalog-purchase-gift-button"
                    >
                        <BitmapText
                            recipe="regular-12"
                            color="#000000"
                            align="center"
                            className="catalog-purchase-gift-label"
                        >
                            {t('catalog.purchase_confirmation.gift', 'Gift')}
                        </BitmapText>
                    </Button>
                    <ContainerButton
                        variant="6"
                        type="button"
                        className="catalog-purchase-buy-button"
                        disabled={accountSafetyLocked || isSoldOut}
                        onClick={openPurchase}
                    >
                        <BitmapText
                            recipe="bold-12"
                            color="#ffffff"
                            align="center"
                            className="catalog-purchase-buy-label"
                        >
                            {isSoldOut
                                ? t('catalog.limited.sold_out', 'Sold out')
                                : buyCaption}
                        </BitmapText>
                    </ContainerButton>
                </div>
                {portalTarget &&
                    confirmationOffer &&
                    confirmationOffer.offerId === activeOffer.offerId &&
                    createPortal(
                        <div className="catalog-purchase-modal-layer">
                            <CatalogPurchaseConfirmationView
                                offer={confirmationOffer}
                                isPending={isPending}
                                onConfirm={confirmPurchase}
                                onClose={closePurchase}
                            />
                        </div>,
                        portalTarget,
                    )}
                {portalTarget &&
                    alert &&
                    createPortal(
                        <div className="catalog-purchase-modal-layer">
                            <CatalogPurchaseAlertView
                                {...alert}
                                buttonLabel={t('generic.ok', 'OK')}
                                onClose={() => setAlert(undefined)}
                            />
                        </div>,
                        portalTarget,
                    )}
            </>
        );
    }

    return (
        <div className="catalog-purchase-empty">
            <Border variant="6" className="catalog-purchase-empty-surface" />
            <BitmapText
                recipe="bold-14"
                color="#666666"
                align="center"
                className="catalog-purchase-empty-label"
            >
                {t('catalog.purchase.select.info')}
            </BitmapText>
        </div>
    );
};
