import {
    AvatarGenderType,
    AvatarScaleType,
    type IAssetData,
    type IAvatarEffectListener,
    type IAvatarImage,
    type IAvatarImageListener,
    type IObjectVisualizationData,
    RoomGeometryScaleType,
} from '@nitrodevco/nitro-api';

import { GetAvatarRenderManager } from '#renderer/avatar';

export class AvatarVisualizationData implements IObjectVisualizationData {
    public initialize(asset: IAssetData | undefined): boolean {
        return true;
    }

    public dispose(): void { }

    public createAvatarImage(
        figure: string,
        size: RoomGeometryScaleType,
        gender: AvatarGenderType,
        avatarListener: IAvatarImageListener,
        effectListener: IAvatarEffectListener | undefined = undefined,
    ): IAvatarImage | undefined {
        if (size > RoomGeometryScaleType.AvatarSizeNormal)
            return GetAvatarRenderManager().createAvatarImage(
                figure,
                AvatarScaleType.Large,
                gender,
                avatarListener,
                effectListener,
            );

        // TODO: render zoomed-out avatars from the native `sh_*` sprites again once the
        // `hh_human_50_*` bundles are rebuilt — the converted ones are currently empty,
        // so AvatarScaleType.Small resolves no assets at all and draws nothing. Until
        // then LargeScaledSmall produces the same 32px output by downsampling the large
        // sprites. See getFigurePartSetLibraries in AvatarAssetDownloadManager.
        return GetAvatarRenderManager().createAvatarImage(
            figure,
            AvatarScaleType.LargeScaledSmall,
            gender,
            avatarListener,
            effectListener,
        );
    }

    public get layerCount(): number {
        return 0;
    }
}
