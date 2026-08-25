import { useState } from "react";

import { useSystemActions, useTranslation } from "#base/context";
import { Frame, TabButton, TabContent, TabContext } from "#base/theme";

import { InventoryBadgesView } from "./InventoryBadgesView";
import { InventoryBotsView } from "./InventoryBotsView";
import { InventoryFurniView } from "./InventoryFurniView";
import { InventoryPetsView } from "./InventoryPetsView";

export const InventoryView = () => {
    const [activeTab, setActiveTab] = useState<string>('furni');
    const t = useTranslation();
    const { toggleWindow } = useSystemActions();

    return (
        <Frame id="inventory" variant="3" className="left-5 w-122.5 h-85.5" caption={t('inventory.title')} captionTextRecipe="bold-12" captionTextColor="#ffffff" onClose={() => toggleWindow('inventory')}>
            <TabContext data-name="tabs">
                <TabButton textRecipe="regular-12" textColor="#000000" onClick={() => setActiveTab('furni')} aria-selected={activeTab === 'furni'}>
                    {t('inventory.furni')}
                </TabButton>
                <TabButton textRecipe="regular-12" textColor="#000000" onClick={() => setActiveTab('pets')} aria-selected={activeTab === 'pets'}>
                    {t('inventory.furni.tab.pets')}
                </TabButton>
                <TabButton textRecipe="regular-12" textColor="#000000" onClick={() => setActiveTab('bots')} aria-selected={activeTab === 'bots'}>
                    {t('inventory.bots')}
                </TabButton>
                <TabButton textRecipe="regular-12" textColor="#000000" onClick={() => setActiveTab('badges')} aria-selected={activeTab === 'badges'}>
                    {t('inventory.badges')}
                </TabButton>
            </TabContext>
            <TabContent>
                {activeTab === 'furni' && <InventoryFurniView />}
                {activeTab === 'pets' && <InventoryPetsView />}
                {activeTab === 'bots' && <InventoryBotsView />}
                {activeTab === 'badges' && <InventoryBadgesView />}
            </TabContent>
        </Frame>
    )
}