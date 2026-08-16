import { Button, Frame } from '#base/theme';

export type CatalogPurchaseAlert = {
    title: string;
    message: string;
};

type CatalogPurchaseAlertViewProps = CatalogPurchaseAlert & {
    buttonLabel: string;
    onClose: () => void;
};

export const CatalogPurchaseAlertView = (props: CatalogPurchaseAlertViewProps) => {
    const { title, message, buttonLabel, onClose } = props;

    return (
        <Frame
            variant="3"
            tintColor="#418db0"
            className="catalog-purchase-alert"
            contentClassName="p-0!"
            caption={title}
            captionTextRecipe="bold-12"
            captionTextColor="#ffffff"
            onClose={onClose}
        >
            <div className="catalog-purchase-alert-content">
                <div className="catalog-purchase-alert-message">{message}</div>
                <Button
                    variant="3"
                    className="catalog-purchase-alert-button"
                    onClick={onClose}
                >
                    {buttonLabel}
                </Button>
            </div>
        </Frame>
    );
};
