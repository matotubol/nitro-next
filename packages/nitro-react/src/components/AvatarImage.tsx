import type { AvatarGenderType } from '@nitrodevco/nitro-api';
import { AvatarScaleType, AvatarSetType } from '@nitrodevco/nitro-api';
import { AvatarImageView, GetAvatarRenderManager } from '@nitrodevco/nitro-renderer';
import { forwardRef, useEffect, useState } from 'react';

type AvatarImageProps = {
    figure: string;
    gender: AvatarGenderType;
    headOnly?: boolean;
    direction?: number;
    scale?: number;
    crop?: 'avatar' | 'face';
};

export const AvatarImage = forwardRef<HTMLDivElement, AvatarImageProps>(
    (props, ref) => {
        const { figure, gender, headOnly = false, direction = 0, scale = 1, crop = 'avatar' } = props;
        const [renderVersion, setRenderVersion] = useState<number>(0);
        const [imageData, setImageData] = useState<{
            width: number;
            height: number;
            url: string;
        }>({ width: 0, height: 0, url: '' });
        useEffect(() => {
            if (!figure) return;

            let cancelled = false;
            let renderSettled = false;
            let avatarDisposed = false;

            const disposeAvatar = () => {
                if (avatarDisposed) return;

                avatarDisposed = true;
                avatarImage?.dispose();
            };

            const avatarImage = GetAvatarRenderManager().createAvatarImage(
                figure,
                AvatarScaleType.Large,
                gender,
                {
                    resetFigure: (_figure: string) => {
                        if (cancelled) return;

                        setRenderVersion(version => version + 1);
                    },
                },
                {
                    resetEffect: (_effect: number) => {
                        if (cancelled) return;

                        setRenderVersion(version => version + 1);
                    },
                },
            );

            if (!avatarImage) return;

            let setType = AvatarSetType.Full;

            if (headOnly) setType = AvatarSetType.Head;

            avatarImage.setDirection(AvatarSetType.Full, direction);
            avatarImage.setDirection(AvatarSetType.Head, direction);

            const load = async () => {
                try {
                    let image;

                    if (crop === 'face') {
                        image = await AvatarImageView.renderImage(avatarImage, { type: 'face', scale });
                    } else {
                        image = await avatarImage.getCroppedImageAsync(setType, false, scale);
                    }

                    if (!image || cancelled) return;

                    setImageData({
                        width: image.width,
                        height: image.height,
                        url: image.src,
                    });
                } finally {
                    renderSettled = true;
                    disposeAvatar();
                }
            };

            void load();

            return () => {
                cancelled = true;

                if (renderSettled) disposeAvatar();
            };
        }, [figure, gender, headOnly, direction, scale, crop, renderVersion]);

        return (
            <div
                className="avatar-image-container"
                ref={ref}
                style={{
                    width: imageData.width,
                    height: imageData.height,
                    backgroundImage: `url(${imageData.url})`,
                    backgroundPosition: crop === 'face' ? 'center' : 'center -8px',
                    backgroundRepeat: 'no-repeat',
                    pointerEvents: 'none',
                }}
            />
        );
    },
);
