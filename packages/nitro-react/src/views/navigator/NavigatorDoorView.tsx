import type { KeyboardEvent } from 'react';
import { useState } from 'react';

import { NavigatorDoorState, useNavigatorDoorData, useTranslation } from '#base/context';
import { useNavigatorRoomEntry } from '#base/hooks';
import { Border, Button, Frame } from '#base/theme';

/**
 * `GuestRoomDoorbell` and `GuestRoomPasswordInput` folded into one prompt - both
 * gate the same connect, they just ask for different things first.
 */
export const NavigatorDoorView = () => {
    const doorData = useNavigatorDoorData();
    const { submitPassword, cancelDoor } = useNavigatorRoomEntry();
    const [password, setPassword] = useState('');
    const t = useTranslation();

    const { roomInfo, state } = doorData;
    const roomId = roomInfo?.roomId ?? -1;
    const [lastRoomId, setLastRoomId] = useState(roomId);

    // a prompt for a different room never inherits the previous attempt's password
    if (lastRoomId !== roomId) {
        setLastRoomId(roomId);
        setPassword('');
    }

    if (!roomInfo || state === NavigatorDoorState.None) return null;

    // a failed attempt re-opens the password box - retrying is the whole point
    const isPassword = state === NavigatorDoorState.Password || state === NavigatorDoorState.Failed;
    const isWaiting = state === NavigatorDoorState.Start || state === NavigatorDoorState.Waiting;

    const message = (() => {
        switch (state) {
            case NavigatorDoorState.Password: return t('navigator.password.title', 'This room needs a password');
            case NavigatorDoorState.Failed: return t('navigator.password.retryenter', 'Wrong password, try again');
            case NavigatorDoorState.NoAnswer: return t('navigator.doorbell.no.answer', 'Nobody answered the door');
            case NavigatorDoorState.Unavailable: return t('navigator.roomdoesnotexist', 'That room is not available right now');
            default: return t('navigator.doorbell.waiting.for.answer', 'Waiting for someone to let you in...');
        }
    })();

    const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key !== 'Enter') return;

        submitPassword(roomInfo, password);
    };

    return (
        <div className="navigator-modal-layer">
            <Frame
                id="navigator-door"
                variant="3"
                className="navigator-door"
                caption={roomInfo.name}
                captionTextRecipe="bold-12"
                captionTextColor="#ffffff"
                onClose={cancelDoor}
                contentClassName="p-0!">
                <div className="navigator-door-body">
                    <div className="navigator-door-message">{message}</div>
                    {isPassword && (
                        <Border variant="4" className="w-full">
                            <input
                                type="password"
                                className="navigator-door-input"
                                aria-label={t('navigator.password.title', 'Password')}
                                value={password}
                                onChange={event => setPassword(event.target.value)}
                                onKeyDown={onKeyDown}
                            />
                        </Border>
                    )}
                    <div className="navigator-door-buttons">
                        <Button variant="3" className="navigator-door-button" onClick={cancelDoor}>
                            {t('generic.cancel', 'Cancel')}
                        </Button>
                        {isPassword && (
                            <Button variant="5" className="navigator-door-button" onClick={() => submitPassword(roomInfo, password)}>
                                {t('navigator.password.enter', 'Enter')}
                            </Button>
                        )}
                        {(!isPassword && !isWaiting) && (
                            <Button variant="5" className="navigator-door-button" onClick={() => submitPassword(roomInfo, '')}>
                                {t('navigator.doorbell.button.ring.again', 'Ring again')}
                            </Button>
                        )}
                    </div>
                </div>
            </Frame>
        </div>
    );
}
