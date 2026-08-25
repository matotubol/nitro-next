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
    /**
     * 'avatar' crops to the figure's visible bounds, so the image size changes with the
     * figure (taller hair -> taller image). 'imager' renders into the fixed Habbo imager
     * viewport instead, so every figure comes back the same size and stays put.
     */
    crop?: 'avatar' | 'face' | 'imager';
    offsetY?: number;
};

export const AvatarImage = forwardRef<HTMLDivElement, AvatarImageProps>(
    (props, ref) => {
        const {
            figure,
            gender,
            headOnly = false,
            direction = 0,
            scale = 1,
            crop = 'avatar',
            offsetY = crop === 'avatar' ? -8 : 0,
        } = props;
        const [renderVersion, setRenderVersion] = useState<number>(0);
        const [imageData, setImageData] = useState<{
            width: number;
            height: number;
            url: string;
        }>({ width: 0, height: 0, url: '' });
        useEffect(() => {
            // Hold the last frame until the next one is ready. Blanking here collapses the
            // element to 0x0, so any parent that centres on it snaps the avatar to a new
            // position and back every time the figure changes.
            if (!figure) {
                setImageData({ width: 0, height: 0, url: '' });

                return;
            }

            let cancelled = false;
            let avatarDisposed = false;

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

            const disposeAvatar = () => {
                if (avatarDisposed) return;

                avatarDisposed = true;
                avatarImage.dispose();
            };

            let setType = AvatarSetType.Full;

            if (headOnly) setType = AvatarSetType.Head;

            avatarImage.setDirection(AvatarSetType.Full, direction);
            avatarImage.setDirection(AvatarSetType.Head, direction);

            const load = async () => {
                try {
                    let image;

                    if (crop === 'face' || crop === 'imager') {
                        image = await AvatarImageView.renderImage(avatarImage, {
                            type: crop,
                            setType,
                            scale,
                        });
                    } else {
                        image = await avatarImage.getCroppedImageAsync(
                            setType,
                            false,
                            scale,
                        );
                    }

                    if (!image || cancelled) return;

                    setImageData({
                        width: image.width,
                        height: image.height,
                        url: image.src,
                    });
                } catch {
                    if (!cancelled) setImageData({ width: 0, height: 0, url: '' });
                } finally {
                    disposeAvatar();
                }
            };

            void load();

            return () => {
                cancelled = true;
            };
        }, [
            figure,
            gender,
            headOnly,
            direction,
            scale,
            crop,
            offsetY,
            renderVersion,
        ]);

        return (
            <div
                className="avatar-image-container"
                ref={ref}
                style={{
                    width: imageData.width,
                    height: imageData.height,
                    backgroundImage: `url(${imageData.url})`,
                    backgroundPosition: `center ${offsetY}px`,
                    backgroundRepeat: 'no-repeat',
                    pointerEvents: 'none',
                }}
            />
        );
    },
);
