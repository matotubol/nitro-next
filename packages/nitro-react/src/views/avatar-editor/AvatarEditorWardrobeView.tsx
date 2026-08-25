import { AvatarGenderType, ClubLevelEnum } from '@nitrodevco/nitro-api';
import type { WardrobeOutfit } from '@nitrodevco/nitro-packets';
import { useMemo } from 'react';

import { AvatarImage } from '#base/components/AvatarImage';
import { useTranslation } from '#base/context';
import { BitmapText, Border, cn, NitroIcon } from '#base/theme';

import { normalizeAvatarGender } from './avatarEditorFigure';

type AvatarEditorWardrobeViewProps = {
    figure: string;
    gender: AvatarGenderType;
    outfits: WardrobeOutfit[];
    maxSlots: number;
    clubLevel: ClubLevelEnum;
    onSave: (slotId: number, figure: string, gender: AvatarGenderType) => void;
    onWear: (outfit: WardrobeOutfit) => void;
};

const ASSET_ROOT = '/assets/flash/avatareditor';
// slots_column_template holds 7 slot_template entries within its 412px height.
const SLOTS_PER_COLUMN = 7;
// The slot figure is a 22x48 crop of the large avatar.
const THUMB_SCALE = 0.44;

const isWardrobeSlotEnabled = (slotId: number, clubLevel: ClubLevelEnum) =>
    slotId <= 5 ? clubLevel >= ClubLevelEnum.Club : clubLevel >= ClubLevelEnum.Vip;

export const AvatarEditorWardrobeView = ({
    figure,
    gender,
    outfits,
    maxSlots,
    clubLevel,
    onSave,
    onWear,
}: AvatarEditorWardrobeViewProps) => {
    const t = useTranslation();
    const outfitsBySlot = useMemo(
        () => new Map(outfits.map(outfit => [outfit.slotId, outfit])),
        [outfits],
    );

    return (
        <aside data-name="wardrobe" className="relative h-[490px] w-[182px] shrink-0">
            {/* splitter x=0 y=0 1x490 */}
            <div
                data-name="splitter"
                className="absolute top-0 left-0 h-[490px] w-px bg-black"
            />

            {/* main_container x=6 y=0 168x490 */}
            <div
                data-name="main_container"
                className="absolute top-0 left-[6px] h-[490px] w-[168px]"
            >
                {/* header y=19 h=23 */}
                <div
                    data-name="header"
                    className="absolute top-[19px] left-0 flex h-[23px] w-[168px] items-start justify-between"
                >
                    {/* wardrobe title: u_bold, 158x17, colour 0x83827e */}
                    <BitmapText
                        recipe="bold-12"
                        color="#83827e"
                        align="left"
                        className="block h-[17px] w-[158px]"
                    >
                        {t('avatareditor.wardrobe.title')}
                    </BitmapText>
                    <NitroIcon data-name="hc_icon" icon="icon-hc-small" />
                </div>

                {/* border x=15 y=53 139x418 */}
                <Border
                    variant="4"
                    tintColor="#bcbcbc"
                    className="absolute top-[53px] left-[15px] h-[418px] w-[139px] overflow-hidden"
                >
                    {/* slots_columns_list x=4 y=0, columns pitched 68px apart */}
                    <div
                        data-name="slots_columns_list"
                        className="absolute top-[3px] left-[4px] grid grid-flow-col gap-x-[12px] gap-y-[3px]"
                        style={{
                            gridTemplateRows: `repeat(${SLOTS_PER_COLUMN}, 56px)`,
                            gridTemplateColumns: `repeat(${Math.max(1, Math.ceil(maxSlots / SLOTS_PER_COLUMN))}, 56px)`,
                        }}
                    >
                        {Array.from({ length: maxSlots }, (_, index) => {
                            const slotId = index + 1;
                            const outfit = outfitsBySlot.get(slotId);
                            const enabled = isWardrobeSlotEnabled(slotId, clubLevel);

                            return (
                                <div
                                    key={slotId}
                                    data-name="slot_template"
                                    className="relative size-[56px]"
                                >
                                    <Border
                                        variant="100"
                                        className="pointer-events-none absolute inset-0"
                                    />

                                    {/* figure well x=29 y=3 24x50 */}
                                    <Border
                                        variant="3"
                                        tintColor="#666666"
                                        className="pointer-events-none absolute top-[3px] left-[29px] h-[50px] w-[24px] opacity-30"
                                    />

                                    {/* set_button x=3 y=3 22x26, icon at y=9 */}
                                    <button
                                        data-name="set_button"
                                        type="button"
                                        className="absolute top-[3px] left-[3px] h-[26px] w-[22px] cursor-pointer disabled:cursor-not-allowed disabled:opacity-0"
                                        disabled={!enabled}
                                        aria-label={`${t('avatareditor.wardrobe.save')} ${slotId}`}
                                        onClick={() => onSave(slotId, figure, gender)}
                                    >
                                        {/* 22x15 slot holding the 5x9 chevron at its natural size */}
                                        <span className="absolute top-[9px] left-0 flex h-[15px] w-[22px] items-center justify-center">
                                            <img
                                                className="pixel-art"
                                                alt=""
                                                src={`${ASSET_ROOT}/wardrobe-save-arrow.png`}
                                            />
                                        </span>
                                    </button>

                                    {/* get_button x=2 y=28 22x26, icon at y=0 */}
                                    <button
                                        data-name="get_button"
                                        type="button"
                                        className="absolute top-[28px] left-[2px] h-[26px] w-[22px] cursor-pointer disabled:cursor-not-allowed disabled:opacity-0"
                                        disabled={!enabled || !outfit}
                                        aria-label={`${t('avatareditor.wardrobe.wear')} ${slotId}`}
                                        onClick={() => outfit && onWear(outfit)}
                                    >
                                        {/* 22x15 slot holding the 5x9 chevron at its natural size */}
                                        <span className="absolute top-0 left-0 flex h-[15px] w-[22px] items-center justify-center">
                                            <img
                                                className="pixel-art"
                                                alt=""
                                                src={`${ASSET_ROOT}/wardrobe-wear-arrow.png`}
                                            />
                                        </span>
                                    </button>

                                    {/* get_figure x=29 y=3 24x50, wrapping the 22x48 image */}
                                    <button
                                        data-name="get_figure"
                                        type="button"
                                        className="absolute top-[3px] left-[29px] flex h-[50px] w-[24px] cursor-pointer items-center justify-center overflow-hidden disabled:cursor-default"
                                        disabled={!enabled || !outfit}
                                        aria-label={`${t('avatareditor.wardrobe.wear')} ${slotId}`}
                                        onClick={() => outfit && onWear(outfit)}
                                    >
                                        {outfit ? (
                                            <div
                                                className={cn(
                                                    'flex h-[48px] w-[22px] items-center justify-center overflow-hidden',
                                                    !enabled && 'opacity-45 grayscale',
                                                )}
                                            >
                                                <AvatarImage
                                                    figure={outfit.figure}
                                                    gender={normalizeAvatarGender(
                                                        outfit.gender,
                                                    )}
                                                    direction={4}
                                                    scale={THUMB_SCALE}
                                                    offsetY={-8 * THUMB_SCALE}
                                                />
                                            </div>
                                        ) : (
                                            <img
                                                className="pixel-art"
                                                alt=""
                                                src={`${ASSET_ROOT}/wardrobe-empty-slot.png`}
                                            />
                                        )}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </Border>
            </div>
        </aside>
    );
};
