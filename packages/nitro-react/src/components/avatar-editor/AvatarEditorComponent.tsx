import {
    useConfigValue,
    useIsWindowVisible,
    useOwnClubLevel,
    useOwnUserFigure,
    useOwnUserGender,
    useOwnUserName,
    useSystemActions,
} from '#base/context';
import { AvatarEditorView } from '#base/views/avatar-editor/AvatarEditorView';

import { useAvatarEditorMessages } from './useAvatarEditorMessages';

const DEFAULT_WARDROBE_SLOTS = 10;
const MAX_WARDROBE_SLOTS = 14;

export const AvatarEditorComponent = () => {
    const isVisible = useIsWindowVisible('avatar-editor');
    const ownFigure = useOwnUserFigure();
    const ownGender = useOwnUserGender();
    const ownName = useOwnUserName();
    const clubLevel = useOwnClubLevel();
    const configuredSlots =
        useConfigValue<number>('avatar.wardrobe.max.slots') ?? DEFAULT_WARDROBE_SLOTS;
    const maxWardrobeSlots = Math.min(
        MAX_WARDROBE_SLOTS,
        Math.max(1, Math.floor(configuredSlots)),
    );
    const { hideWindow } = useSystemActions();
    const { ownedFigureSetIds, wardrobeOutfits, saveFigure, saveOutfit } =
        useAvatarEditorMessages(isVisible, maxWardrobeSlots);

    const saveAndClose = (...args: Parameters<typeof saveFigure>) => {
        saveFigure(...args);
        hideWindow('avatar-editor');
    };

    if (!isVisible) return null;

    return (
        <AvatarEditorView
            key={`${ownGender}:${ownFigure}`}
            ownName={ownName}
            ownFigure={ownFigure}
            ownGender={ownGender}
            clubLevel={clubLevel}
            ownedFigureSetIds={ownedFigureSetIds}
            wardrobeOutfits={wardrobeOutfits}
            maxWardrobeSlots={maxWardrobeSlots}
            onClose={() => hideWindow('avatar-editor')}
            onSaveFigure={saveAndClose}
            onSaveOutfit={saveOutfit}
        />
    );
};
