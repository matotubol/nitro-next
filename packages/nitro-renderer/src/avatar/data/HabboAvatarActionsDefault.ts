import { AvatarActionStateType, AvatarActionType, AvatarGeometryType, AvatarPartSetType, AvatarScaleType, type IAssetAvatarActionData } from "@nitrodevco/nitro-api";

export const HabboAvatarActionsDefault: IAssetAvatarActionData = {
    actions: [
        {
            id: AvatarActionType.Default,
            state: AvatarActionStateType.Stand,
            precedence: 1000,
            main: true,
            isDefault: true,
            geometryType: AvatarGeometryType.Vertical,
            activePartSet: AvatarPartSetType.Figure,
            assetPartDefinition: "std"
        }],
    actionOffsets: [
        {
            action: "lay",
            offsets: [
                {
                    size: AvatarScaleType.Large,
                    direction: 4,
                    x: -17,
                    y: 17,
                    z: -0.9
                },
                {
                    size: AvatarScaleType.Large,
                    direction: 2,
                    x: 22,
                    y: 17,
                    z: -0.9
                },
                {
                    size: AvatarScaleType.Small,
                    direction: 4,
                    x: -5,
                    y: 16,
                    z: -0.9
                },
                {
                    size: AvatarScaleType.Small,
                    direction: 2,
                    x: 9,
                    y: 16,
                    z: -0.9
                }
            ]
        },
        {
            action: "swim",
            offsets: [
                {
                    size: AvatarScaleType.Small,
                    direction: 0,
                    x: -28,
                    y: 0,
                    z: 0
                },
                {
                    size: AvatarScaleType.Small,
                    direction: 1,
                    x: -28,
                    y: 0,
                    z: 0
                },
                {
                    size: AvatarScaleType.Small,
                    direction: 2,
                    x: -28,
                    y: 0,
                    z: 0
                },
                {
                    size: AvatarScaleType.Small,
                    direction: 3,
                    x: -28,
                    y: 0,
                    z: 0
                },
                {
                    size: AvatarScaleType.Small,
                    direction: 4,
                    x: 0,
                    y: 0,
                    z: 0
                },
                {
                    size: AvatarScaleType.Small,
                    direction: 5,
                    x: 0,
                    y: 0,
                    z: 0
                },
                {
                    size: AvatarScaleType.Small,
                    direction: 6,
                    x: 0,
                    y: 0,
                    z: 0
                },
                {
                    size: AvatarScaleType.Small,
                    direction: 7,
                    x: -28,
                    y: 0,
                    z: 0
                }
            ]
        }
    ]
};
