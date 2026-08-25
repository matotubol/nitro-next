import {
    AvatarFigurePartType,
    AvatarGenderType,
    type IFigurePartSet,
    type IPartColor,
} from '@nitrodevco/nitro-api';
import { GetAvatarRenderManager } from '@nitrodevco/nitro-renderer';

const MANDATORY_CHECK_LEVEL = 2;

export const normalizeAvatarGender = (gender: string): AvatarGenderType =>
    gender.toUpperCase() === 'F' ? AvatarGenderType.Female : AvatarGenderType.Male;

export const getFigurePartSets = (
    partType: AvatarFigurePartType,
    gender: AvatarGenderType,
) => {
    const setType = GetAvatarRenderManager().structureData.getSetType(partType);

    if (!setType) return [];

    return Array.from(setType.partSets.values())
        .filter(
            partSet =>
                partSet.isSelectable &&
                (partSet.gender === gender ||
                    partSet.gender === AvatarGenderType.Unisex),
        )
        .sort(
            (left, right) =>
                Number(right.isPreSelectable) - Number(left.isPreSelectable) ||
                left.id - right.id,
        );
};

export const isFigurePartSetAvailable = (
    partSet: IFigurePartSet,
    clubLevel: number,
    ownedFigureSetIds: ReadonlySet<number>,
) =>
    partSet.clubLevel <= clubLevel &&
    (!partSet.isSellable || ownedFigureSetIds.has(partSet.id));

export const getFigurePartColors = (partType: AvatarFigurePartType) => {
    const structureData = GetAvatarRenderManager().structureData;
    const setType = structureData.getSetType(partType);
    const palette = setType ? structureData.getPalette(setType.paletteId) : undefined;

    if (!palette) return [];

    return Array.from(palette.colors.values())
        .filter(color => color.isSelectable)
        .sort((left, right) => left.index - right.index || left.id - right.id);
};

export const getFigurePartColorLayerCount = (partSet: IFigurePartSet) =>
    partSet.isColorable
        ? Math.max(0, ...partSet.parts.map(part => part.colorLayerIndex))
        : 0;

const getDefaultColorIds = (
    partSet: IFigurePartSet,
    partType: AvatarFigurePartType,
    clubLevel: number,
    preferredColorIds: number[] = [],
) => {
    const colors = getFigurePartColors(partType);
    const availableColors = colors.filter(color => color.clubLevel <= clubLevel);
    const fallbackColor = availableColors[0] ?? colors[0];
    const colorCount = getFigurePartColorLayerCount(partSet);

    return Array.from({ length: colorCount }, (_, index) => {
        const preferredColor = colors.find(
            color => color.id === preferredColorIds[index],
        );

        return preferredColor?.id ?? fallbackColor?.id ?? 0;
    });
};

export const getFigurePartPreviewColorIds = (
    partType: AvatarFigurePartType,
    partSet: IFigurePartSet,
    clubLevel: number,
    preferredColorIds: number[],
) => getDefaultColorIds(partSet, partType, clubLevel, preferredColorIds);

export const replaceFigurePart = (
    figure: string,
    partType: AvatarFigurePartType,
    partSet: IFigurePartSet,
    clubLevel: number,
) => {
    const manager = GetAvatarRenderManager();
    const container = manager.createFigureContainer(figure);
    const colorIds = getDefaultColorIds(
        partSet,
        partType,
        clubLevel,
        container.getPartColorIds(partType),
    );

    container.updatePart(partType, partSet.id, colorIds);

    return container.getFigureString();
};

export const replaceFigurePartColor = (
    figure: string,
    partType: AvatarFigurePartType,
    partSet: IFigurePartSet,
    colorLayer: number,
    color: IPartColor,
    clubLevel: number,
) => {
    const manager = GetAvatarRenderManager();
    const container = manager.createFigureContainer(figure);
    const colorIds = getDefaultColorIds(
        partSet,
        partType,
        clubLevel,
        container.getPartColorIds(partType),
    );

    if (colorLayer >= 0 && colorLayer < colorIds.length)
        colorIds[colorLayer] = color.id;

    container.updatePart(partType, partSet.id, colorIds);

    return container.getFigureString();
};

export const removeFigurePart = (figure: string, partType: AvatarFigurePartType) => {
    const container = GetAvatarRenderManager().createFigureContainer(figure);

    container.removePart(partType);

    return container.getFigureString();
};

export const isFigurePartMandatory = (
    partType: AvatarFigurePartType,
    gender: AvatarGenderType,
) =>
    GetAvatarRenderManager()
        .structureData.getSetType(partType)
        ?.isMandatory(gender, MANDATORY_CHECK_LEVEL) ?? false;

export const createFigureForGender = (
    sourceFigure: string,
    gender: AvatarGenderType,
    clubLevel: number,
    ownedFigureSetIds: ReadonlySet<number>,
) => {
    const manager = GetAvatarRenderManager();
    const container = manager.createFigureContainer(sourceFigure);

    for (const partType of container.getPartTypeIds()) {
        if (
            !manager.isValidFigureSetForGender(container.getPartSetId(partType), gender)
        ) {
            container.removePart(partType);
        }
    }

    for (const partType of manager.getMandatoryAvatarPartSetIds(
        gender,
        MANDATORY_CHECK_LEVEL,
    )) {
        if (container.hasPartType(partType as AvatarFigurePartType)) continue;

        const candidates = getFigurePartSets(partType as AvatarFigurePartType, gender);
        const partSet =
            candidates.find(candidate =>
                isFigurePartSetAvailable(candidate, clubLevel, ownedFigureSetIds),) ?? candidates[0];

        if (!partSet) continue;

        container.updatePart(
            partType as AvatarFigurePartType,
            partSet.id,
            getDefaultColorIds(partSet, partType as AvatarFigurePartType, clubLevel),
        );
    }

    return container.getFigureString();
};
