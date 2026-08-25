import {
    AvatarFigurePartType,
    AvatarGenderType,
    ClubLevelEnum,
} from '@nitrodevco/nitro-api';
import type { WardrobeOutfit } from '@nitrodevco/nitro-packets';
import { useMemo, useState } from 'react';

import { AvatarImage } from '#base/components/AvatarImage';
import { useTranslation } from '#base/context';
import {
    Button,
    ButtonThick,
    Frame,
    TabContainerButton,
    TabContent,
    TabContext,
} from '#base/theme';

import {
    AVATAR_EDITOR_CATEGORIES,
    type AvatarEditorTabId,
    getAvatarEditorCategory,
} from './avatarEditorCategories';
import { AvatarEditorCategoryControls } from './AvatarEditorCategoryControls';
import { createFigureForGender, normalizeAvatarGender } from './avatarEditorFigure';
import { AvatarEditorPartSelector } from './AvatarEditorPartSelector';
import { AvatarEditorWardrobeView } from './AvatarEditorWardrobeView';

type AvatarEditorViewProps = {
    ownName: string;
    ownFigure: string;
    ownGender: AvatarGenderType;
    clubLevel: ClubLevelEnum;
    ownedFigureSetIds: number[];
    wardrobeOutfits: WardrobeOutfit[];
    maxWardrobeSlots: number;
    onClose: () => void;
    onSaveFigure: (figure: string, gender: AvatarGenderType) => void;
    onSaveOutfit: (slotId: number, figure: string, gender: AvatarGenderType) => void;
};

type GenderFigures = Record<AvatarGenderType.Male | AvatarGenderType.Female, string>;

const ASSET_ROOT = '/assets/flash/avatareditor';
const EDITOR_WIDTH = 490;
const WARDROBE_WIDTH = 182;
// sideContainer anchors the wardrobe at x=487.
const WARDROBE_X = 487;
// avatarWidget is a room_previewer, 125x210, with room_previewer:zoom=2 (and
// offsetx=-65 / offsety=-30, which are previewer camera coords, not CSS offsets).
const PREVIEW_SCALE = 2;
// The viewport AvatarImageView renders a full large avatar into. Pinning the slot to it
// keeps the preview anchored while a figure renders, instead of collapsing to 0x0 and
// snapping back when the image lands.
const PREVIEW_WIDTH = 64;
const PREVIEW_HEIGHT = 110;
// habbo_skin_button_tab_3 draws the tab 32px tall with scale vertical="fixed", so the
// tab must never be stretched or its borders thicken.
const TAB_HEIGHT = 32;
// The tab buttons sit at y=9, but each tab bitmap is drawn at y=-5 within its button,
// so the visible tab rides higher than the button box and lands on the header. The exact
// lift is eyeballed against the reference: 9 sits too low, 4 too high. Tabs run
// y=TAB_STRIP_Y..+32 relative to avatarEditor, whose header ends at y=40.
const TAB_STRIP_Y = 7;
// AvatarEditorFrame sets every margin to 0 and puts maincontent at x=0 spanning the full
// frame width, starting below the 33px title bar of habbo_skin_frame_3.
const FRAME_HEIGHT = 33 + 490;

export const AvatarEditorView = ({
    ownName,
    ownFigure,
    ownGender,
    clubLevel,
    ownedFigureSetIds,
    wardrobeOutfits,
    maxWardrobeSlots,
    onClose,
    onSaveFigure,
    onSaveOutfit,
}: AvatarEditorViewProps) => {
    const t = useTranslation();
    const normalizedOwnGender = normalizeAvatarGender(ownGender);
    const ownedFigureSetIdSet = useMemo(
        () => new Set(ownedFigureSetIds),
        [ownedFigureSetIds],
    );
    const [initialFigures] = useState<GenderFigures>(() => ({
        [AvatarGenderType.Male]:
            normalizedOwnGender === AvatarGenderType.Male
                ? ownFigure
                : createFigureForGender(
                      ownFigure,
                      AvatarGenderType.Male,
                      clubLevel,
                      ownedFigureSetIdSet,
                  ),
        [AvatarGenderType.Female]:
            normalizedOwnGender === AvatarGenderType.Female
                ? ownFigure
                : createFigureForGender(
                      ownFigure,
                      AvatarGenderType.Female,
                      clubLevel,
                      ownedFigureSetIdSet,
                  ),
    }));
    const [figuresByGender, setFiguresByGender] =
        useState<GenderFigures>(initialFigures);
    const [gender, setGender] = useState(normalizedOwnGender);
    const [activeTab, setActiveTab] = useState<AvatarEditorTabId>('generic');
    const [selectedPartType, setSelectedPartType] = useState<AvatarFigurePartType>(
        AvatarFigurePartType.Head,
    );
    const [direction, setDirection] = useState(4);
    const [wardrobeOpen, setWardrobeOpen] = useState(true);
    const activeCategory = getAvatarEditorCategory(activeTab);
    const figure = figuresByGender[gender];
    const contentWidth = wardrobeOpen ? WARDROBE_X + WARDROBE_WIDTH : EDITOR_WIDTH;
    const frameWidth = contentWidth;
    const hasParts = activeCategory.partTypes.length > 0;

    const updateFigure = (nextFigure: string) => {
        setFiguresByGender(current => ({ ...current, [gender]: nextFigure }));
    };

    const selectTab = (tabId: AvatarEditorTabId) => {
        const category = getAvatarEditorCategory(tabId);

        setActiveTab(tabId);

        if (category.partTypes[0]) setSelectedPartType(category.partTypes[0]);
    };

    const wearOutfit = (outfit: WardrobeOutfit) => {
        const outfitGender = normalizeAvatarGender(outfit.gender);

        setGender(outfitGender);
        setFiguresByGender(current => ({
            ...current,
            [outfitGender]: outfit.figure,
        }));
    };

    return (
        <Frame
            id="avatar-editor"
            variant="3"
            style={{
                width: frameWidth,
                height: FRAME_HEIGHT,
                left: `calc(50% - ${Math.floor(frameWidth / 2)}px)`,
                top: `calc(50% - ${Math.floor(FRAME_HEIGHT / 2)}px)`,
            }}
            caption={t('avatareditor.title')}
            captionTextRecipe="bold-12"
            captionTextColor="#ffffff"
            contentClassName="p-0!"
            onClose={onClose}
        >
            {/* avatarEditorContent 490x490 */}
            <div
                data-name="avatarEditorContent"
                className="relative h-[490px] shrink-0 overflow-hidden"
                style={{ width: contentWidth }}
            >
                <main className="absolute top-0 left-0 h-[490px] w-[490px]">
                    {/* avatarNameEditor x=1 y=0 489x110. The background is 486 wide in the
                        layout, but maincontent spans the full frame so it is stretched edge
                        to edge here rather than leaking the frame fill down the side. */}
                    <div
                        data-name="avatarNameEditor"
                        className="absolute top-0 left-0 h-[110px]"
                        style={{ width: wardrobeOpen ? WARDROBE_X : EDITOR_WIDTH }}
                    >
                        <div
                            data-name="name_background"
                            className="absolute top-0 left-0 h-[110px] w-full bg-[#0e3f52]"
                        />
                        <div
                            data-name="avatar_name"
                            className="absolute top-[15px] left-[40px] h-[35px] w-[400px] truncate text-center text-[28px] leading-[35px] font-bold text-white"
                        >
                            {ownName}
                        </div>
                    </div>

                    {/* wardrobeButtonContainer x=424 y=9 55x30 */}
                    <Button
                        data-name="wardrobe"
                        variant="3"
                        className="absolute top-[9px] left-[424px] z-30 h-[30px] w-[55px] p-0"
                        aria-label={t('avatareditor.wardrobe.title')}
                        aria-pressed={wardrobeOpen}
                        onClick={() => setWardrobeOpen(current => !current)}
                    >
                        <img
                            className="pixel-art"
                            alt=""
                            src={`${ASSET_ROOT}/wardrobe-tab-icon.png`}
                        />
                    </Button>

                    {/* avatarEditor x=1 y=70 489x414 - offsets below are relative to this,
                        with the intermediate tabbedView (y=4) folded in. */}
                    <div
                        data-name="avatarEditor"
                        className="absolute top-[70px] left-px h-[414px] w-[489px]"
                    >
                        {/* mainTabs: tabbedView(0,4) + (0,5). The button is 52x46 in the layout,
                            but habbo_skin_button_tab_3 draws it 32px tall with
                            scale vertical="fixed" — stretching it past 32 is what thickens the
                            selected tab's top border. At TAB_STRIP_Y the tabs run y=77..109,
                            inside the 110px header. TabContext defaults to px-2/pt-px and clamps itself
                            to 34px, so those defaults are overridden here. The 6px left inset is
                            the tab_context skin's "selector" placeholder (x=6), which the layout
                            XML does not mention. */}
                        <TabContext
                            data-name="mainTabs"
                            className="absolute left-0 z-20 flex w-[486px] pt-0! pr-0! pl-[6px]"
                            style={{
                                top: TAB_STRIP_Y,
                                height: TAB_HEIGHT,
                                minHeight: TAB_HEIGHT,
                                maxHeight: TAB_HEIGHT,
                            }}
                        >
                            {AVATAR_EDITOR_CATEGORIES.map(category => (
                                <TabContainerButton
                                    key={category.id}
                                    data-name={category.id}
                                    variant="3"
                                    className="flex w-[52px] shrink-0 cursor-pointer items-center justify-center"
                                    style={{ height: TAB_HEIGHT }}
                                    role="tab"
                                    tabIndex={activeTab === category.id ? 0 : -1}
                                    aria-label={t(category.localizationKey)}
                                    aria-selected={activeTab === category.id}
                                    onClick={() => selectTab(category.id)}
                                    onKeyDown={event => {
                                        if (event.key !== 'Enter' && event.key !== ' ')
                                            return;

                                        event.preventDefault();
                                        selectTab(category.id);
                                    }}
                                >
                                    <img
                                        className="pixel-art"
                                        alt=""
                                        src={`${ASSET_ROOT}/${category.icon}`}
                                    />
                                </TabContainerButton>
                            ))}
                        </TabContext>

                        {/* contentArea: tabbedView(0,4) + (2,36) 486x365 */}
                        <TabContent
                            data-name="contentArea"
                            variant="3"
                            className="pointer-events-none absolute top-[40px] left-[2px] z-10 h-[365px] w-[486px]"
                        />

                        {/* *_content: contentArea(2,40) + (20,10) */}
                        {hasParts && (
                            <div
                                data-name={`${activeCategory.id}_content`}
                                className="absolute top-[50px] left-[22px] z-20 h-[35px]"
                                style={{ width: activeCategory.contentWidth }}
                            >
                                <AvatarEditorCategoryControls
                                    isBodyCategory={activeTab === 'generic'}
                                    gender={gender}
                                    partTypes={activeCategory.partTypes}
                                    selectedPartType={selectedPartType}
                                    onGenderChange={setGender}
                                    onPartTypeChange={setSelectedPartType}
                                />
                            </div>
                        )}

                        {/* grid_container: tabbedView(0,4) + (20,94) 330x302 */}
                        <div
                            data-name="grid_container"
                            className="absolute top-[98px] left-[20px] z-20 h-[302px] w-[330px]"
                        >
                            {hasParts ? (
                                <AvatarEditorPartSelector
                                    figure={figure}
                                    gender={gender}
                                    selectedPartType={selectedPartType}
                                    clubLevel={clubLevel}
                                    ownedFigureSetIds={ownedFigureSetIdSet}
                                    onFigureChange={updateFigure}
                                />
                            ) : (
                                <div
                                    data-name="content_title"
                                    className="h-[30px] w-[300px] text-[12px] leading-[30px] font-bold text-[#5a5a5a]"
                                >
                                    {t(activeCategory.localizationKey)}
                                </div>
                            )}
                        </div>

                        {/* avatarWidget x=351 y=88 125x210 - a sibling of tabbedView, so it is
                            not offset by contentArea. */}
                        <div
                            data-name="avatarWidget"
                            className="absolute top-[88px] left-[351px] z-20 flex h-[210px] w-[125px] items-center justify-center overflow-hidden"
                        >
                            {/* crop="imager" renders into the fixed 64x110 viewport so the
                                avatar keeps its position when the figure changes; a cropped
                                image resizes with the silhouette and makes it jump. The 2x
                                is applied here because the renderer's own scale is set on
                                the container before extraction and does not survive it. */}
                            <div
                                className="pixel-art shrink-0"
                                style={{
                                    width: PREVIEW_WIDTH,
                                    height: PREVIEW_HEIGHT,
                                    transform: `scale(${PREVIEW_SCALE})`,
                                    transformOrigin: 'center',
                                }}
                            >
                                <AvatarImage
                                    figure={figure}
                                    gender={gender}
                                    direction={direction}
                                    crop="imager"
                                />
                            </div>
                        </div>

                        {/* rotate_avatar x=389 y=295 50x31 */}
                        <button
                            data-name="rotate_avatar"
                            type="button"
                            className="absolute top-[295px] left-[389px] z-20 flex h-[31px] w-[50px] cursor-pointer items-center justify-center"
                            aria-label="Rotate avatar"
                            onClick={() => setDirection(current => (current + 1) % 8)}
                        >
                            <img
                                className="pixel-art"
                                alt=""
                                src={`${ASSET_ROOT}/rotate-avatar-icon.png`}
                            />
                        </button>

                        {/* save x=356 y=373 122x28 */}
                        <ButtonThick
                            data-name="save"
                            variant="3"
                            className="absolute top-[373px] left-[356px] z-20 h-[28px] w-[122px]"
                            textRecipe="bold-12"
                            textColor="#000000"
                            onClick={() => onSaveFigure(figure, gender)}
                        >
                            {t('avatareditor.save')}
                        </ButtonThick>
                    </div>
                </main>

                {wardrobeOpen && (
                    <div
                        data-name="sideContainer"
                        className="absolute top-0 z-40"
                        style={{ left: WARDROBE_X }}
                    >
                        <AvatarEditorWardrobeView
                            figure={figure}
                            gender={gender}
                            outfits={wardrobeOutfits}
                            maxSlots={maxWardrobeSlots}
                            clubLevel={clubLevel}
                            onSave={onSaveOutfit}
                            onWear={wearOutfit}
                        />
                    </div>
                )}
            </div>
        </Frame>
    );
};
