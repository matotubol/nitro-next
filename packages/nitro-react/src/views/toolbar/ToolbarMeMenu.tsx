import { forwardRef } from 'react';

import { useTranslation } from '#base/context';
import { NitroIcon } from '#base/theme';

type ToolbarMeMenuProps = {
    onOpenMyClothes: () => void;
};

export const ToolbarMeMenu = forwardRef<HTMLDivElement, ToolbarMeMenuProps>(
    ({ onOpenMyClothes }, ref) => {
        const t = useTranslation();

        return (
            <div className="toolbar-menu" ref={ref}>
                <div className="toolbar-menu-button">
                    <NitroIcon icon="icon-me-profile" />
                    <span>{t('widget.memenu.profile')}</span>
                </div>
                <div className="toolbar-menu-button">
                    <NitroIcon icon="icon-me-rooms" />
                    <span>{t('widget.memenu.myrooms')}</span>
                </div>
                <div className="toolbar-menu-button" onClick={onOpenMyClothes}>
                    <NitroIcon icon="icon-me-clothing" />
                    <span>{t('widget.memenu.myclothes')}</span>
                </div>
                <div className="toolbar-menu-button">
                    <NitroIcon icon="icon-me-forums" />
                    <span>{t('widget.memenu.forums')}</span>
                </div>
                <div className="toolbar-menu-button">
                    <NitroIcon icon="icon-me-collectibles" />
                    <span>{t('memenu.collectibles')}</span>
                </div>
            </div>
        );
    },
);
