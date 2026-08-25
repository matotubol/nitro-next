import { AvatarGenderType } from '@nitrodevco/nitro-api';
import {
    FigureSetIdsEventMessage,
    GetWardrobeComposer,
    SaveWardrobeOutfitComposer,
    UpdateFigureDataComposer,
    WardrobeMessage,
    type WardrobeOutfit,
} from '@nitrodevco/nitro-packets';
import { useCallback, useEffect, useState } from 'react';

import { useWebSocketContext } from '#base/context';
import { useMessageListener } from '#base/hooks';

export const useAvatarEditorMessages = (
    isVisible: boolean,
    maxWardrobeSlots: number,
) => {
    const [ownedFigureSetIds, setOwnedFigureSetIds] = useState<number[]>([]);
    const [wardrobeOutfits, setWardrobeOutfits] = useState<WardrobeOutfit[]>([]);
    const { send } = useWebSocketContext();

    useMessageListener(FigureSetIdsEventMessage, event => {
        setOwnedFigureSetIds(Array.from(new Set(event.figureSetIds)));
    });

    useMessageListener(WardrobeMessage, event => {
        const uniqueOutfits = new Map<number, WardrobeOutfit>();

        for (const outfit of event.outfits) {
            if (
                outfit.slotId < 1 ||
                outfit.slotId > maxWardrobeSlots ||
                !outfit.figure ||
                !outfit.gender
            )
                continue;

            uniqueOutfits.set(outfit.slotId, outfit);
        }

        setWardrobeOutfits(
            Array.from(uniqueOutfits.values()).sort(
                (left, right) => left.slotId - right.slotId,
            ),
        );
    });

    useEffect(() => {
        if (!isVisible) return;

        send(new GetWardrobeComposer({}));
    }, [isVisible, send]);

    const saveOutfit = useCallback(
        (slotId: number, figure: string, gender: AvatarGenderType) => {
            send(new SaveWardrobeOutfitComposer({ slotId, figure, gender }));
            setWardrobeOutfits(current =>
                [
                    ...current.filter(outfit => outfit.slotId !== slotId),
                    { slotId, figure, gender },
                ].sort((left, right) => left.slotId - right.slotId),);
        },
        [send],
    );

    const saveFigure = useCallback(
        (figure: string, gender: AvatarGenderType) => {
            send(new UpdateFigureDataComposer({ gender, figure }));
        },
        [send],
    );

    return {
        ownedFigureSetIds,
        wardrobeOutfits,
        saveFigure,
        saveOutfit,
    };
};
