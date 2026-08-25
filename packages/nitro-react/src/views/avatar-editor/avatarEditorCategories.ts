import { AvatarFigurePartType } from '@nitrodevco/nitro-api';

export type AvatarEditorTabId =
    | 'generic'
    | 'head'
    | 'torso'
    | 'legs'
    | 'misc'
    | 'hotlooks'
    | 'effects'
    | 'nfts';

export type AvatarEditorCategory = {
    id: AvatarEditorTabId;
    localizationKey: string;
    icon: string;
    /** Width of the sub-tab strip, per the matching `*_content` container. */
    contentWidth: number;
    /**
     * Part types the tab edits. Empty means the tab is a placeholder that renders
     * its chrome but has no part grid behind it yet.
     */
    partTypes: AvatarFigurePartType[];
};

export const AVATAR_EDITOR_CATEGORIES: AvatarEditorCategory[] = [
    {
        id: 'generic',
        localizationKey: 'avatareditor.category.hd',
        icon: 'generic-tab-icon.png',
        contentWidth: 250,
        partTypes: [AvatarFigurePartType.Head],
    },
    {
        id: 'head',
        localizationKey: 'avatareditor.category.head',
        icon: 'head-tab-icon.png',
        contentWidth: 280,
        partTypes: [
            AvatarFigurePartType.Hair,
            AvatarFigurePartType.HeadAccessory,
            AvatarFigurePartType.HeadAccessoryExtra,
            AvatarFigurePartType.EyeAccessory,
            AvatarFigurePartType.FaceAccessory,
        ],
    },
    {
        id: 'torso',
        localizationKey: 'avatareditor.category.torso',
        icon: 'torso-tab-icon.png',
        contentWidth: 210,
        partTypes: [
            AvatarFigurePartType.Chest,
            AvatarFigurePartType.ChestPrint,
            AvatarFigurePartType.CoatChest,
            AvatarFigurePartType.ChestAccessory,
        ],
    },
    {
        id: 'legs',
        localizationKey: 'avatareditor.category.legs',
        icon: 'legs-tab-icon.png',
        contentWidth: 170,
        partTypes: [
            AvatarFigurePartType.Legs,
            AvatarFigurePartType.Shoes,
            AvatarFigurePartType.WaistAccessory,
        ],
    },
    {
        id: 'misc',
        localizationKey: 'avatareditor.category.misc',
        icon: 'misc-tab-icon.png',
        contentWidth: 250,
        partTypes: [],
    },
    {
        id: 'hotlooks',
        localizationKey: 'avatareditor.hotlooks.title',
        icon: 'hotlooks-tab-icon.png',
        contentWidth: 310,
        partTypes: [],
    },
    {
        id: 'effects',
        localizationKey: 'inventory.effects',
        icon: 'effects-tab-icon.png',
        contentWidth: 140,
        partTypes: [],
    },
    {
        id: 'nfts',
        localizationKey: 'avatareditor.nfts.title',
        icon: 'nfts-tab-icon.png',
        contentWidth: 310,
        partTypes: [],
    },
];

export const getAvatarEditorCategory = (id: AvatarEditorTabId) =>
    AVATAR_EDITOR_CATEGORIES.find(category => category.id === id) ??
    AVATAR_EDITOR_CATEGORIES[0];
