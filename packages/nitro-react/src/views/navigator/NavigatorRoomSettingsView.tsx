import { RoomDoorModeEnum, RoomTradeModeEnum } from '@nitrodevco/nitro-api';
import type { RoomSettingsDataEventMessageType } from '@nitrodevco/nitro-packets';
import { DeleteRoomComposer, SaveRoomSettingsComposer } from '@nitrodevco/nitro-packets';
import { useState } from 'react';

import {
    useNavigatorActions,
    useNavigatorContext,
    useNavigatorRoomSettingsData,
    useNavigatorRoomSettingsError,
    useTranslation,
    useWebSocketContext
} from '#base/context';
import { Border, Button, Frame } from '#base/theme';

const MAX_USER_OPTIONS = [10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100];
const MAX_TAGS = 2;

/** Server-side RoomSettingsErrorType codes worth a specific sentence. */
const ERROR_KEYS: Record<number, [string, string]> = {
    7: ['navigator.roomsettings.error.name', 'That room name cannot be used'],
    9: ['navigator.roomsettings.error.desc', 'That description cannot be used'],
    5: ['navigator.roomsettings.error.password', 'A password room needs a password'],
    4: ['navigator.roomsettings.error.visitors', 'That visitor limit is not allowed'],
    6: ['navigator.roomsettings.error.category', 'That category cannot be used'],
    11: ['navigator.roomsettings.error.tags', 'Those tags cannot be used'],
    13: ['navigator.roomsettings.error.tags.length', 'A tag is too long'],
    2: ['navigator.roomsettings.error.owner', 'Only the room owner can change these settings']
};

/** `RoomSettings` - the owner's door, category, tags and behaviour in one form. */
export const NavigatorRoomSettingsView = () => {
    const data = useNavigatorRoomSettingsData();

    if (!data) return null;

    // keyed by room so a form for another room never inherits half-edited state
    return <RoomSettingsForm key={data.roomId} data={data} />;
}

const RoomSettingsForm = ({ data }: { data: RoomSettingsDataEventMessageType }) => {
    const { setRoomSettingsData } = useNavigatorActions();
    const error = useNavigatorRoomSettingsError();
    const flatCategories = useNavigatorContext(x => x.flatCategories);
    const { send } = useWebSocketContext();
    const t = useTranslation();

    const [name, setName] = useState(data.name);
    const [description, setDescription] = useState(data.description);
    const [doorMode, setDoorMode] = useState(data.doorMode);
    const [password, setPassword] = useState('');
    const [maxVisitors, setMaxVisitors] = useState(data.maxVisitors);
    const [categoryId, setCategoryId] = useState(data.categoryId);
    const [tags, setTags] = useState<string[]>([...data.tags]);
    const [tradeMode, setTradeMode] = useState(data.tradeMode);
    const [allowPets, setAllowPets] = useState(data.allowPets);
    const [allowFoodConsume, setAllowFoodConsume] = useState(data.allowFoodConsume);
    const [allowWalkThrough, setAllowWalkThrough] = useState(data.allowWalkThrough);
    const [hideWalls, setHideWalls] = useState(data.hideWalls);
    const [confirmingDelete, setConfirmingDelete] = useState(false);

    const close = () => setRoomSettingsData(undefined);

    const needsPassword = doorMode === RoomDoorModeEnum.Password;
    const canSubmit = name.trim().length > 0 && (!needsPassword || password.length > 0);

    const setTag = (index: number, value: string) => {
        setTags(previous => {
            const next = [...previous];

            next[index] = value;

            return next;
        });
    };

    const submit = () => {
        if (!canSubmit) return;

        send(new SaveRoomSettingsComposer({
            roomId: data.roomId,
            roomName: name.trim(),
            roomDescription: description.trim(),
            doorMode,
            password: needsPassword ? password : '',
            maxVisitors,
            categoryId,
            tags: tags.map(x => x.trim()).filter(x => x.length > 0),
            tradeMode,
            allowPets,
            allowFoodConsume,
            allowWalkThrough,
            hideWalls,
            // untouched by this form - handed back exactly as the server sent them
            wallThickness: data.wallThickness,
            floorThickness: data.floorThickness,
            whoCanMute: data.moderationSettings.whoCanMute,
            whoCanKick: data.moderationSettings.whoCanKick,
            whoCanBan: data.moderationSettings.whoCanBan,
            chatMode: data.chatSettings.mode,
            chatBubbleSize: data.chatSettings.bubbleSize,
            chatScrollUpFrequency: data.chatSettings.scrollUpFrequency,
            chatFullHearRange: data.chatSettings.fullHearRange,
            chatFloodSensitivity: data.chatSettings.floodSensitivity,
            allowNavigatorDynCats: data.allowNavigatorDynCats
        }));
    };

    const deleteRoom = () => {
        if (!confirmingDelete) {
            setConfirmingDelete(true);

            return;
        }

        send(new DeleteRoomComposer({ roomId: data.roomId }));
        close();
    };

    const errorText = error
        ? (ERROR_KEYS[error.code]
            ? t(ERROR_KEYS[error.code][0], ERROR_KEYS[error.code][1])
            : t('navigator.roomsettings.error.generic', 'The settings could not be saved'))
        : undefined;

    return (
        <div className="navigator-modal-layer">
            <Frame
                id="navigator-room-settings"
                variant="3"
                className="navigator-settings-window"
                caption={t('navigator.roomsettings', 'Room settings')}
                captionTextRecipe="bold-12"
                captionTextColor="#ffffff"
                onClose={close}
                contentClassName="p-0!">
                <div className="navigator-creator navigator-settings">
                    <div className="navigator-creator-field">
                        <span className="navigator-creator-label">{t('navigator.roomname', 'Room name')}</span>
                        <Border variant="4">
                            <input
                                type="text"
                                className="navigator-creator-input"
                                maxLength={60}
                                value={name}
                                onChange={event => setName(event.target.value)}
                            />
                        </Border>
                    </div>
                    <div className="navigator-creator-field">
                        <span className="navigator-creator-label">{t('navigator.roomsettings.desc', 'Description')}</span>
                        <Border variant="4">
                            <textarea
                                className="navigator-creator-input is-multiline"
                                maxLength={255}
                                value={description}
                                onChange={event => setDescription(event.target.value)}
                            />
                        </Border>
                    </div>
                    <div className="navigator-settings-row">
                        <div className="navigator-creator-field flex-1">
                            <span className="navigator-creator-label">{t('navigator.roomsettings.doormode', 'Door mode')}</span>
                            <Border variant="4">
                                <select
                                    className="navigator-creator-select"
                                    value={doorMode}
                                    onChange={event => setDoorMode(parseInt(event.target.value, 10))}>
                                    <option value={RoomDoorModeEnum.Open}>{t('navigator.roomsettings.doormode.open', 'Open')}</option>
                                    <option value={RoomDoorModeEnum.Locked}>{t('navigator.roomsettings.doormode.doorbell', 'Doorbell')}</option>
                                    <option value={RoomDoorModeEnum.Password}>{t('navigator.roomsettings.doormode.password', 'Password')}</option>
                                    <option value={RoomDoorModeEnum.Invisible}>{t('navigator.roomsettings.doormode.invisible', 'Invisible')}</option>
                                </select>
                            </Border>
                        </div>
                        <div className="navigator-creator-field w-24">
                            <span className="navigator-creator-label">{t('navigator.maxvisitors', 'Max users')}</span>
                            <Border variant="4">
                                <select
                                    className="navigator-creator-select"
                                    value={maxVisitors}
                                    onChange={event => setMaxVisitors(parseInt(event.target.value, 10))}>
                                    {MAX_USER_OPTIONS
                                        .filter(x => x <= (data.maxVisitorsLimit || 100))
                                        .map(x => <option key={x} value={x}>{x}</option>)}
                                </select>
                            </Border>
                        </div>
                    </div>
                    {needsPassword && (
                        <div className="navigator-creator-field">
                            <span className="navigator-creator-label">{t('navigator.roomsettings.password', 'Password')}</span>
                            <Border variant="4">
                                <input
                                    type="password"
                                    className="navigator-creator-input"
                                    maxLength={64}
                                    placeholder={t('navigator.roomsettings.password.new', 'Set a new password')}
                                    value={password}
                                    onChange={event => setPassword(event.target.value)}
                                />
                            </Border>
                        </div>
                    )}
                    <div className="navigator-settings-row">
                        <div className="navigator-creator-field flex-1">
                            <span className="navigator-creator-label">{t('navigator.category', 'Category')}</span>
                            <Border variant="4">
                                <select
                                    className="navigator-creator-select"
                                    value={categoryId}
                                    onChange={event => setCategoryId(parseInt(event.target.value, 10))}>
                                    <option value={-1}>{t('navigator.category.none', 'No category')}</option>
                                    {flatCategories.filter(x => x.visible).map(x => (
                                        <option key={x.id} value={x.id}>
                                            {x.globalCategoryKey.length
                                                ? t(`navigator.flatcategory.global.${x.globalCategoryKey}`, x.name)
                                                : x.name}
                                        </option>
                                    ))}
                                </select>
                            </Border>
                        </div>
                        <div className="navigator-creator-field w-32">
                            <span className="navigator-creator-label">{t('navigator.tradesettings', 'Trading')}</span>
                            <Border variant="4">
                                <select
                                    className="navigator-creator-select"
                                    value={tradeMode}
                                    onChange={event => setTradeMode(parseInt(event.target.value, 10))}>
                                    <option value={RoomTradeModeEnum.Disabled}>{t('navigator.roomsettings.trade_not_allowed', 'Not allowed')}</option>
                                    <option value={RoomTradeModeEnum.RoomOwnerAndRights}>{t('navigator.roomsettings.trade_not_with_Controller', 'Owner and rights')}</option>
                                    <option value={RoomTradeModeEnum.Everyone}>{t('navigator.roomsettings.trade_allowed', 'Everyone')}</option>
                                </select>
                            </Border>
                        </div>
                    </div>
                    <div className="navigator-creator-field">
                        <span className="navigator-creator-label">{t('navigator.roomsettings.tags', 'Tags')}</span>
                        <div className="navigator-settings-row">
                            {Array.from({ length: MAX_TAGS }, (_, index) => (
                                <Border key={index} variant="4" className="flex-1">
                                    <input
                                        type="text"
                                        className="navigator-creator-input"
                                        maxLength={24}
                                        value={tags[index] ?? ''}
                                        onChange={event => setTag(index, event.target.value)}
                                    />
                                </Border>
                            ))}
                        </div>
                    </div>
                    <div className="navigator-settings-checks">
                        <label className="navigator-settings-check">
                            <input type="checkbox" checked={allowPets} onChange={event => setAllowPets(event.target.checked)} />
                            {t('navigator.roomsettings.allowpets', 'Allow pets')}
                        </label>
                        <label className="navigator-settings-check">
                            <input type="checkbox" checked={allowFoodConsume} onChange={event => setAllowFoodConsume(event.target.checked)} />
                            {t('navigator.roomsettings.allowfoodconsume', 'Pets can eat your food')}
                        </label>
                        <label className="navigator-settings-check">
                            <input type="checkbox" checked={allowWalkThrough} onChange={event => setAllowWalkThrough(event.target.checked)} />
                            {t('navigator.roomsettings.allow_walk_through', 'Walk through other users')}
                        </label>
                        <label className="navigator-settings-check">
                            <input type="checkbox" checked={hideWalls} onChange={event => setHideWalls(event.target.checked)} />
                            {t('navigator.roomsettings.hide_walls', 'Hide the walls')}
                        </label>
                    </div>
                    {errorText && <div className="navigator-settings-error">{errorText}</div>}
                    <div className="navigator-door-buttons mt-auto">
                        <Button variant="3" className="navigator-door-button" onClick={deleteRoom}>
                            {confirmingDelete
                                ? t('navigator.roomsettings.deleteroom.confirm', 'Really delete?')
                                : t('navigator.roomsettings.deleteroom', 'Delete room')}
                        </Button>
                        <Button variant="5" className="navigator-door-button" disabled={!canSubmit} onClick={submit}>
                            {t('navigator.roomsettings.save', 'Save')}
                        </Button>
                    </div>
                </div>
            </Frame>
        </div>
    );
}
