import { AvatarActionStateType, AvatarExpressionStates, AvatarGenderType, AvatarGestureStates, AvatarPostureStates, AvatarScaleType, AvatarSetType, type IAvatarImage } from "@nitrodevco/nitro-api";
import { AvatarImageView, GetAvatarRenderManager } from "@nitrodevco/nitro-renderer";
import { Hono } from "hono";

import { ParseEnum } from "./ParseEnum";
import { ParseIntInRange } from "./ParseIntInRange";

const hono = new Hono();

const POSTURE_ALIASES = new Map<string, AvatarActionStateType>([
    ['std', AvatarActionStateType.Stand],
    ['stand', AvatarActionStateType.Stand],
    ['sit', AvatarActionStateType.Sit],
    ['lay', AvatarActionStateType.Lay],
    ['mv', AvatarActionStateType.Walk],
    ['wlk', AvatarActionStateType.Walk],
    ['walk', AvatarActionStateType.Walk],
    ['swim', AvatarActionStateType.Swim],
    ['float', AvatarActionStateType.Float],
]);

const EXPRESSION_ALIASES = new Map<string, AvatarActionStateType>([
    ['wav', AvatarActionStateType.Wave],
    ['wave', AvatarActionStateType.Wave],
    ['respect', AvatarActionStateType.Respect],
    ['blow', AvatarActionStateType.BlowAKiss],
    ['laugh', AvatarActionStateType.Laugh],
    ['cry', AvatarActionStateType.Cry],
    ['idle', AvatarActionStateType.Idle],
]);

const GESTURE_ALIASES = new Map<string, AvatarActionStateType>([
    ['agr', AvatarActionStateType.Angry],
    ['sad', AvatarActionStateType.Sad],
    ['sml', AvatarActionStateType.Smile],
    ['srp', AvatarActionStateType.Surprised],
]);

const isEnabled = (value: string | undefined) => value !== undefined && !['0', 'false', 'no'].includes(value.toLowerCase());

const appendAction = async (avatar: IAvatarImage, value: string | undefined) => {
    if (!value) return;

    const normalized = value.trim().toLowerCase();
    const posture = POSTURE_ALIASES.get(normalized);

    if (posture) {
        avatar.appendAction(AvatarActionStateType.Posture, posture);

        return;
    }

    const expression = EXPRESSION_ALIASES.get(normalized);

    if (expression) {
        avatar.appendAction(expression);

        return;
    }

    const gesture = GESTURE_ALIASES.get(normalized);

    if (gesture) {
        avatar.appendAction(AvatarActionStateType.Gesture, gesture);

        return;
    }

    if (normalized === 'spk' || normalized === 'talk') {
        avatar.appendAction(AvatarActionStateType.Talk);

        return;
    }

    if (normalized === 'eyb' || normalized === 'sleep') {
        avatar.appendAction(AvatarActionStateType.Sleep);

        return;
    }

    const parameterized = /^(dance|fx|cri|crr|usei|drk|sign)[.=]?(\d+)?$/.exec(normalized);

    if (!parameterized) return;

    const parameter = Number(parameterized[2] ?? 1);

    if (parameterized[1] === 'dance') {
        avatar.appendAction(AvatarActionStateType.Dance, Math.min(4, Math.max(1, parameter)));
    } else if (parameterized[1] === 'fx' && parameter > 0) {
        await GetAvatarRenderManager().downloadAvatarEffectAsync(parameter);
        avatar.appendAction(AvatarActionStateType.Effect, parameter);
    } else if ((parameterized[1] === 'cri' || parameterized[1] === 'crr') && parameter > 0) {
        avatar.appendAction(AvatarActionStateType.CarryObject, parameter);
    } else if ((parameterized[1] === 'usei' || parameterized[1] === 'drk') && parameter > 0) {
        avatar.appendAction(AvatarActionStateType.UseObject, parameter);
    } else if (parameterized[1] === 'sign' && parameter >= 0) {
        avatar.appendAction(AvatarActionStateType.Sign, parameter);
    }
};

hono.get('/avatar', async (c) => {
    const query = c.req.query();
    const figure = query.figure ?? 'hd-99999-99999';
    const gender = query.gender as AvatarGenderType ?? AvatarGenderType.Male;
    const size = (query.size ?? 'm').toLowerCase();
    const avatarScale = size === 's' ? AvatarScaleType.LargeScaledSmall : AvatarScaleType.Large;
    const outputScale = size === 'l' ? 2 : 1;
    const avatar = await GetAvatarRenderManager().createAvatarImageAsync(figure, avatarScale, gender);

    if (!avatar) return c.json({ error: '' }, 400);

    try {
        const setType = isEnabled(query.headOnly ?? query.headonly) ? AvatarSetType.Head : AvatarSetType.Full;
        const direction = ParseIntInRange(query.direction, 0, 7, 2);
        const headDirection = ParseIntInRange(query.headDirection ?? query.head_direction, 0, 7, direction);
        const danceValue = query.danceId ?? query.dance;
        const effectValue = query.effectId ?? query.effect;
        const danceId = danceValue !== undefined ? ParseIntInRange(danceValue, 0, 4, 0) : undefined;
        const effectId = effectValue !== undefined ? Number(effectValue) || undefined : undefined;
        const requestedFrame = Number(query.frameNumber ?? query.frame_num ?? query.frame ?? 0);

        avatar.setDirection(AvatarSetType.Full, direction);
        avatar.setDirection(AvatarSetType.Head, headDirection);
        avatar.initActionAppends();

        if (query.action) for (const action of query.action.split(',')) await appendAction(avatar, action);

        if (query.posture !== undefined) {
            let posture = POSTURE_ALIASES.get(query.posture.toLowerCase()) ?? query.posture as AvatarActionStateType;

            posture = ParseEnum(posture, AvatarActionStateType, undefined);

            if (posture && AvatarPostureStates.has(posture)) avatar.appendAction(AvatarActionStateType.Posture, posture);
        }

        if (query.expression !== undefined) {
            let expression: AvatarActionStateType | undefined = query.expression as AvatarActionStateType;

            if (expression as string === 'wav') expression = AvatarActionStateType.Wave;

            expression = ParseEnum(expression, AvatarActionStateType, undefined);

            if (expression && AvatarExpressionStates.has(expression)) avatar.appendAction(expression);
        }

        if (query.gesture !== undefined) {
            if (query.gesture === 'spk') {
                avatar.appendAction(AvatarActionStateType.Talk);
            } else if (query.gesture === 'eyb') {
                avatar.appendAction(AvatarActionStateType.Sleep);
            } else {
                const gesture = ParseEnum(query.gesture, AvatarActionStateType, undefined);

                if (gesture && AvatarGestureStates.has(gesture)) avatar.appendAction(AvatarActionStateType.Gesture, gesture);
            }
        }

        if (danceId !== undefined && danceId > 0) avatar.appendAction(AvatarActionStateType.Dance, danceId);

        if (effectId !== undefined && effectId > 0) {
            await GetAvatarRenderManager().downloadAvatarEffectAsync(effectId);

            avatar.appendAction(AvatarActionStateType.Effect, effectId);
        }

        avatar.endActionAppends();

        const totalFrames = Math.max(1, avatar.getTotalFrameCount());
        const frameNumber = Number.isSafeInteger(requestedFrame) && requestedFrame > 0
            ? requestedFrame % totalFrames
            : 0;

        if (frameNumber > 0) avatar.updateAnimationByFrames(frameNumber);

        let buffer = await AvatarImageView.renderBase64(avatar, { type: 'imager', setType, scale: outputScale });

        if (!buffer) return c.json({ error: '' }, 400);

        buffer = buffer.includes(',') ? buffer.split(',')[1] : buffer;

        c.header('Content-Type', `image/png`);

        return c.body(Buffer.from(buffer, 'base64'));
    } finally {
        avatar.dispose();
    }
});

export const GetHono = () => hono;
