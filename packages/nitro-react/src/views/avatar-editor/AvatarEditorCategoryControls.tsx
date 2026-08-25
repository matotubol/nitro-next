import { AvatarFigurePartType, AvatarGenderType } from '@nitrodevco/nitro-api';

import { useTranslation } from '#base/context';
import { BitmapText } from '#base/theme';

type AvatarEditorCategoryControlsProps = {
    isBodyCategory: boolean;
    gender: AvatarGenderType;
    partTypes: AvatarFigurePartType[];
    selectedPartType: AvatarFigurePartType;
    onGenderChange: (gender: AvatarGenderType) => void;
    onPartTypeChange: (partType: AvatarFigurePartType) => void;
};

const ASSET_ROOT = '/assets/flash/avatareditor';

export const AvatarEditorCategoryControls = ({
    isBodyCategory,
    gender,
    partTypes,
    selectedPartType,
    onGenderChange,
    onPartTypeChange,
}: AvatarEditorCategoryControlsProps) => {
    const t = useTranslation();

    if (isBodyCategory) {
        const maleSelected = gender === AvatarGenderType.Male;
        const femaleSelected = gender === AvatarGenderType.Female;

        // generic_content places these at fixed offsets rather than in a row:
        // tab_boy 6,0 47x35 / tab_boy_title 50,10 143x17
        // tab_girl 100,0 47x35 / tab_girl_title 150,10 141x17
        // The title fields are far wider than their text, so they are drawn first and
        // made inert to keep them off the gender buttons that follow.
        return (
            <div className="relative h-[35px]">
                <BitmapText
                    recipe="bold-12"
                    color="#000000"
                    align="left"
                    className="pointer-events-none absolute top-[10px] left-[50px] block h-[17px] w-[143px]"
                >
                    {t('avatareditor.generic.boy')}
                </BitmapText>
                <BitmapText
                    recipe="bold-12"
                    color="#000000"
                    align="left"
                    className="pointer-events-none absolute top-[10px] left-[150px] block h-[17px] w-[141px]"
                >
                    {t('avatareditor.generic.girl')}
                </BitmapText>

                <button
                    data-name="tab_boy"
                    type="button"
                    className="absolute top-0 left-[6px] flex h-[35px] w-[47px] cursor-pointer items-center justify-center"
                    aria-label={t('avatareditor.generic.boy')}
                    aria-pressed={maleSelected}
                    onClick={() => onGenderChange(AvatarGenderType.Male)}
                >
                    <img
                        className="pixel-art"
                        alt=""
                        src={`${ASSET_ROOT}/male${maleSelected ? '-selected' : ''}-icon.png`}
                    />
                </button>

                <button
                    data-name="tab_girl"
                    type="button"
                    className="absolute top-0 left-[100px] flex h-[35px] w-[47px] cursor-pointer items-center justify-center"
                    aria-label={t('avatareditor.generic.girl')}
                    aria-pressed={femaleSelected}
                    onClick={() => onGenderChange(AvatarGenderType.Female)}
                >
                    <img
                        className="pixel-art"
                        alt=""
                        src={`${ASSET_ROOT}/female${femaleSelected ? '-selected' : ''}-icon.png`}
                    />
                </button>
            </div>
        );
    }

    return (
        <div className="flex h-[35px] items-center">
            {partTypes.map(partType => {
                const selected = partType === selectedPartType;

                return (
                    <button
                        key={partType}
                        type="button"
                        className="flex h-[35px] w-[52px] cursor-pointer items-center justify-center"
                        aria-label={t(`avatareditor.category.${partType}`)}
                        aria-pressed={selected}
                        onClick={() => onPartTypeChange(partType)}
                    >
                        <img
                            className="pixel-art"
                            alt=""
                            src={`${ASSET_ROOT}/${partType}${selected ? '-selected' : ''}-icon.png`}
                        />
                    </button>
                );
            })}
        </div>
    );
};
