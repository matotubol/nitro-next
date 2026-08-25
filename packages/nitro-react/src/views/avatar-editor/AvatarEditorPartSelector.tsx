import {
    AvatarFigurePartType,
    AvatarGenderType,
    type IFigurePartSet,
} from '@nitrodevco/nitro-api';
import { GetAvatarRenderManager } from '@nitrodevco/nitro-renderer';
import { useMemo } from 'react';

import { AvatarPartImage } from '#base/components/AvatarPartImage';
import { useTranslation } from '#base/context';
import { cn, InfiniteGrid, ScrollArea } from '#base/theme';

import {
    getFigurePartColorLayerCount,
    getFigurePartColors,
    getFigurePartPreviewColorIds,
    getFigurePartSets,
    isFigurePartMandatory,
    isFigurePartSetAvailable,
    removeFigurePart,
    replaceFigurePart,
    replaceFigurePartColor,
} from './avatarEditorFigure';

type PartChoice = { kind: 'clear' } | { kind: 'part-set'; partSet: IFigurePartSet };

type AvatarEditorPartSelectorProps = {
    figure: string;
    gender: AvatarGenderType;
    selectedPartType: AvatarFigurePartType;
    clubLevel: number;
    ownedFigureSetIds: ReadonlySet<number>;
    onFigureChange: (figure: string) => void;
};

const MAX_COLOR_LAYERS = 2;

export const AvatarEditorPartSelector = ({
    figure,
    gender,
    selectedPartType,
    clubLevel,
    ownedFigureSetIds,
    onFigureChange,
}: AvatarEditorPartSelectorProps) => {
    const t = useTranslation();
    const manager = GetAvatarRenderManager();
    const container = useMemo(
        () => manager.createFigureContainer(figure),
        [figure, manager],
    );
    const selectedSetId = container.getPartSetId(selectedPartType);
    const setType = manager.structureData.getSetType(selectedPartType);
    const selectedPartSet = setType?.getPartSet(selectedSetId);
    const partSets = useMemo(
        () => getFigurePartSets(selectedPartType, gender),
        [selectedPartType, gender],
    );
    const colors = useMemo(
        () => getFigurePartColors(selectedPartType),
        [selectedPartType],
    );
    const canClear = !isFigurePartMandatory(selectedPartType, gender);
    const choices = useMemo<PartChoice[]>(
        () => [
            ...(canClear ? ([{ kind: 'clear' }] as PartChoice[]) : []),
            ...partSets.map(partSet => ({ kind: 'part-set' as const, partSet })),
        ],
        [canClear, partSets],
    );
    const colorLayerCount = selectedPartSet
        ? Math.min(MAX_COLOR_LAYERS, getFigurePartColorLayerCount(selectedPartSet))
        : 0;
    const selectedColorIds = container.getPartColorIds(selectedPartType);

    const selectPartSet = (partSet: IFigurePartSet) => {
        if (!isFigurePartSetAvailable(partSet, clubLevel, ownedFigureSetIds)) return;

        onFigureChange(replaceFigurePart(figure, selectedPartType, partSet, clubLevel));
    };

    return (
        <div className="size-full">
            <div className="h-[200px] overflow-hidden">
                <InfiniteGrid
                    className="p-0"
                    items={choices}
                    itemWidth={50}
                    minHeight={50}
                    horizontalGap={0}
                    verticalGap={0}
                    getKey={choice =>
                        choice.kind === 'clear'
                            ? 'clear'
                            : `part-${choice.partSet.id}`
                    }
                    itemRender={choice => {
                        if (choice.kind === 'clear') {
                            const selected = !selectedSetId;

                            return (
                                <button
                                    type="button"
                                    className="group relative flex size-[50px] cursor-pointer items-center justify-center overflow-hidden"
                                    aria-label={t('avatareditor.clear')}
                                    aria-pressed={selected}
                                    onClick={() =>
                                        onFigureChange(
                                            removeFigurePart(figure, selectedPartType),
                                        )
                                    }
                                >
                                    <img
                                        className={cn(
                                            'pixel-art pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-50',
                                            selected && 'opacity-100',
                                        )}
                                        alt=""
                                        src="/assets/flash/avatareditor/parts-highlight.png"
                                    />
                                    <img
                                        className="pixel-art relative z-10"
                                        alt=""
                                        src="/assets/flash/avatareditor/clear-icon.png"
                                    />
                                </button>
                            );
                        }

                        const { partSet } = choice;
                        const available = isFigurePartSetAvailable(
                            partSet,
                            clubLevel,
                            ownedFigureSetIds,
                        );
                        const selected = selectedSetId === partSet.id;
                        const previewColorIds = getFigurePartPreviewColorIds(
                            selectedPartType,
                            partSet,
                            clubLevel,
                            selectedColorIds,
                        );

                        return (
                            <button
                                type="button"
                                className={cn(
                                    'group relative size-[50px] cursor-pointer overflow-hidden',
                                    !available && 'cursor-not-allowed',
                                )}
                                disabled={!available}
                                aria-label={`${t(`avatareditor.category.${selectedPartType}`)} ${partSet.id}`}
                                aria-pressed={selected}
                                onClick={() => selectPartSet(partSet)}
                            >
                                <img
                                    className={cn(
                                        'pixel-art pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-50',
                                        selected && 'opacity-100',
                                    )}
                                    alt=""
                                    src="/assets/flash/avatareditor/parts-highlight.png"
                                />
                                <div
                                    className={cn(
                                        'relative z-10 flex size-full items-center justify-center',
                                        !available && 'opacity-20',
                                    )}
                                >
                                    <AvatarPartImage
                                        partSet={partSet}
                                        colorIds={previewColorIds}
                                    />
                                </div>
                                {partSet.isSellable && (
                                    <img
                                        className="pixel-art absolute bottom-0 left-0 z-20"
                                        alt=""
                                        src="/assets/flash/avatareditor/sellable-icon.png"
                                    />
                                )}
                                {partSet.clubLevel > 0 && (
                                    <img
                                        className="pixel-art absolute right-0 bottom-0 z-20"
                                        alt=""
                                        src="/assets/flash/avatareditor/hc-small-icon.png"
                                    />
                                )}
                            </button>
                        );
                    }}
                />
            </div>

            <div className="mt-[10px] flex h-[93px]">
                {Array.from({ length: colorLayerCount }, (_, colorLayer) => (
                    <ScrollArea
                        key={colorLayer}
                        variant="3"
                        className="h-[93px]"
                        // palette0/palette1 are 165 wide side by side; a part with a
                        // single colour layer gets the full 330 instead.
                        style={{ width: colorLayerCount > 1 ? 165 : 330 }}
                    >
                        <div className="flex flex-wrap content-start p-0.5">
                            {colors.map(color => {
                                const selected =
                                    selectedColorIds[colorLayer] === color.id;
                                const available = color.clubLevel <= clubLevel;

                                return (
                                    <button
                                        key={color.id}
                                        type="button"
                                        className={cn(
                                            'relative h-[23px] w-[15px] cursor-pointer',
                                            !available &&
                                                'cursor-not-allowed opacity-45',
                                        )}
                                        disabled={!available}
                                        aria-label={`${t('avatareditor.palette')} ${color.id}`}
                                        aria-pressed={selected}
                                        onClick={() =>
                                            selectedPartSet &&
                                            onFigureChange(
                                                replaceFigurePartColor(
                                                    figure,
                                                    selectedPartType,
                                                    selectedPartSet,
                                                    colorLayer,
                                                    color,
                                                    clubLevel,
                                                ),
                                            )
                                        }
                                    >
                                        {/* The 13x21 frame is a 2px border around a
                                            transparent window, so the colour must fill only
                                            that window or it shows through the empty rows
                                            and the rounded corners. The window sits at
                                            x=2 w=9 within the frame (so x=3 in the 15x23
                                            cell), and the frame rides 2px lower when it is
                                            not selected. */}
                                        <span
                                            className={cn(
                                                'absolute left-[3px] h-[13px] w-[9px]',
                                                selected ? 'top-[2px]' : 'top-[4px]',
                                            )}
                                            style={{
                                                backgroundColor: `#${color.rgb.toString(16).padStart(6, '0')}`,
                                            }}
                                        />
                                        <img
                                            className="pixel-art absolute top-0 left-px h-[21px] w-[13px]"
                                            alt=""
                                            src={`/assets/flash/avatareditor/${selected ? 'color-border-selected' : 'color-border'}.png`}
                                        />
                                        {color.clubLevel > 0 && (
                                            <img
                                                className="pixel-art absolute top-[10px] left-[3px]"
                                                alt=""
                                                src="/assets/flash/avatareditor/hc-small-icon.png"
                                            />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </ScrollArea>
                ))}
            </div>
        </div>
    );
};
