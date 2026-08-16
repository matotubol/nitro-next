import { type ChangeEvent, type KeyboardEvent, useState } from 'react';

import { useTranslation } from '#base/context';
import { BitmapText, Border } from '#base/theme';

export const CATALOG_DEFAULT_MAX_PURCHASE_QUANTITY = 100;

type CatalogSpinnerWidgetViewProps = {
    quantity: number;
    maxQuantity?: number;
    onQuantityChange: (quantity: number) => void;
};

const clampQuantity = (quantity: number, maxQuantity: number) =>
    Math.min(Math.max(quantity, 1), maxQuantity);

export const CatalogSpinnerWidgetView = (
    props: CatalogSpinnerWidgetViewProps,
) => {
    const {
        quantity,
        maxQuantity = CATALOG_DEFAULT_MAX_PURCHASE_QUANTITY,
        onQuantityChange,
    } = props;
    const [inputValue, setInputValue] = useState(quantity.toString());
    const t = useTranslation();

    const updateQuantity = (event: ChangeEvent<HTMLInputElement>) => {
        const digits = event.target.value.replace(/\D/g, '');

        if (!digits.length) {
            setInputValue('');
            return;
        }

        const nextQuantity = clampQuantity(Number.parseInt(digits, 10), maxQuantity);

        setInputValue(nextQuantity.toString());

        if (nextQuantity !== quantity) onQuantityChange(nextQuantity);
    };

    const commitQuantity = () => {
        const parsedQuantity = Number.parseInt(inputValue, 10);
        const nextQuantity = clampQuantity(
            Number.isFinite(parsedQuantity) ? parsedQuantity : quantity,
            maxQuantity,
        );

        setInputValue(nextQuantity.toString());

        if (nextQuantity !== quantity) onQuantityChange(nextQuantity);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key !== 'Enter') return;

        event.currentTarget.blur();
    };

    return (
        <div className="catalog-spinner-widget">
            <BitmapText
                recipe="regular-12"
                color="#666666"
                className="catalog-spinner-label"
            >
                {t('catalog.bundlewidget.quantity', 'Quantity')}
            </BitmapText>
            <Border variant="0" className="catalog-spinner-input-frame">
                <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={3}
                    value={inputValue}
                    aria-label={t(
                        'catalog.bundlewidget.spinner.select.amount',
                        'Select Amount',
                    )}
                    className="catalog-spinner-input"
                    onChange={updateQuantity}
                    onBlur={commitQuantity}
                    onKeyDown={handleKeyDown}
                />
            </Border>
        </div>
    );
};
