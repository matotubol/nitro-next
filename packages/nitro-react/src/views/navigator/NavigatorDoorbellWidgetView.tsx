import { LetUserInComposer } from '@nitrodevco/nitro-packets';

import {
    useNavigatorActions,
    useNavigatorDoorbellKnocks,
    useTranslation,
    useWebSocketContext
} from '#base/context';
import { Button, Frame } from '#base/theme';

/**
 * The answerer's half of the doorbell: everyone with rights in the room sees who
 * is knocking, and the first answer settles it for all of them - the server
 * echoes the outcome back so every copy of this widget clears together.
 */
export const NavigatorDoorbellWidgetView = () => {
    const knocks = useNavigatorDoorbellKnocks();
    const { removeDoorbellKnock, clearDoorbellKnocks } = useNavigatorActions();
    const { send } = useWebSocketContext();
    const t = useTranslation();

    if (!knocks.length) return null;

    const answer = (name: string, canEnter: boolean) => {
        send(new LetUserInComposer({ name, canEnter }));

        // the server confirms to every answerer; clearing our own copy now just
        // keeps the widget from waiting on our own echo
        removeDoorbellKnock(name);
    };

    return (
        <Frame
            id="navigator-doorbell"
            variant="3"
            className="navigator-doorbell"
            caption={t('navigator.doorbell.title', 'Doorbell')}
            captionTextRecipe="bold-12"
            captionTextColor="#ffffff"
            onClose={clearDoorbellKnocks}
            contentClassName="p-0!">
            <div className="navigator-doorbell-body">
                {knocks.map(name => (
                    <div key={name} className="navigator-doorbell-row">
                        <span className="navigator-doorbell-name" title={name}>{name}</span>
                        <Button variant="5" className="navigator-doorbell-button" onClick={() => answer(name, true)}>
                            {t('navigator.doorbell.accept', 'Let in')}
                        </Button>
                        <Button variant="3" className="navigator-doorbell-button" onClick={() => answer(name, false)}>
                            {t('navigator.doorbell.deny', 'Deny')}
                        </Button>
                    </div>
                ))}
            </div>
        </Frame>
    );
}
