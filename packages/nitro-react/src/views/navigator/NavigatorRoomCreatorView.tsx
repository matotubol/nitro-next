import { RoomTradeModeEnum } from '@nitrodevco/nitro-api';
import { CreateFlatComposer } from '@nitrodevco/nitro-packets';
import { useState } from 'react';

import {
    useNavigatorActions,
    useNavigatorCreatorSelectors,
    useOwnClubLevel,
    useTranslation,
    useWebSocketContext
} from '#base/context';
import { useNavigatorRoomModels } from '#base/hooks';
import { Border, Button, cn, Frame, ScrollArea } from '#base/theme';

import { GetRoomModelImageUrl } from './navigatorRoomUtils';

const MAX_USER_OPTIONS = [10, 15, 20, 25, 30, 35, 40, 45, 50];

/** `RoomCreator` - name, blurb, floor plan, category and trade rules in one pass. */
export const NavigatorRoomCreatorView = () => {
    const { isCreatorOpen, flatCategories, canCreateRoom, createdRoomLimit } = useNavigatorCreatorSelectors();
    const { setIsCreatorOpen } = useNavigatorActions();
    const { send } = useWebSocketContext();
    const models = useNavigatorRoomModels();
    const clubLevel = useOwnClubLevel();
    const t = useTranslation();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [modelName, setModelName] = useState(models[0]?.name ?? '');
    const [categoryId, setCategoryId] = useState(0);
    const [maxPlayers, setMaxPlayers] = useState(MAX_USER_OPTIONS[0]);
    const [tradeSetting, setTradeSetting] = useState(RoomTradeModeEnum.RoomOwnerAndRights);

    if (!isCreatorOpen) return null;

    const selectableCategories = flatCategories.filter(x => x.visible);
    const canSubmit = canCreateRoom && name.trim().length > 0 && modelName.length > 0;

    const submit = () => {
        if (!canSubmit) return;

        send(new CreateFlatComposer({
            flatName: name.trim(),
            flatDescription: description.trim(),
            flatModelName: modelName,
            categoryID: categoryId,
            maxPlayers,
            tradeSetting
        }));
    };

    return (
        <div className="navigator-modal-layer">
            <Frame
                id="navigator-creator"
                variant="3"
                className="navigator-creator-window"
                caption={t('navigator.createroom.title', 'Create a room')}
                captionTextRecipe="bold-12"
                captionTextColor="#ffffff"
                onClose={() => setIsCreatorOpen(false)}
                contentClassName="p-0!">
                <div className="navigator-creator">
                    <div className="navigator-creator-field">
                        <span className="navigator-creator-label">{t('navigator.createroom.roomnameinfo', 'Room name')}</span>
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
                        <span className="navigator-creator-label">{t('navigator.createroom.roomdescinfo', 'Description')}</span>
                        <Border variant="4">
                            <textarea
                                className="navigator-creator-input is-multiline"
                                maxLength={255}
                                value={description}
                                onChange={event => setDescription(event.target.value)}
                            />
                        </Border>
                    </div>
                    <div className="flex gap-2">
                        <div className="navigator-creator-field flex-1">
                            <span className="navigator-creator-label">{t('navigator.category', 'Category')}</span>
                            <Border variant="4">
                                <select
                                    className="navigator-creator-select"
                                    value={categoryId}
                                    onChange={event => setCategoryId(parseInt(event.target.value, 10))}>
                                    <option value={0}>{t('navigator.category.none', 'No category')}</option>
                                    {selectableCategories.map(x => (
                                        <option key={x.id} value={x.id}>
                                            {x.globalCategoryKey.length
                                                ? t(`navigator.flatcategory.global.${x.globalCategoryKey}`, x.name)
                                                : x.name}
                                        </option>
                                    ))}
                                </select>
                            </Border>
                        </div>
                        <div className="navigator-creator-field w-24">
                            <span className="navigator-creator-label">{t('navigator.maxvisitors', 'Max users')}</span>
                            <Border variant="4">
                                <select
                                    className="navigator-creator-select"
                                    value={maxPlayers}
                                    onChange={event => setMaxPlayers(parseInt(event.target.value, 10))}>
                                    {MAX_USER_OPTIONS.map(x => <option key={x} value={x}>{x}</option>)}
                                </select>
                            </Border>
                        </div>
                        <div className="navigator-creator-field w-32">
                            <span className="navigator-creator-label">{t('navigator.tradesettings', 'Trading')}</span>
                            <Border variant="4">
                                <select
                                    className="navigator-creator-select"
                                    value={tradeSetting}
                                    onChange={event => setTradeSetting(parseInt(event.target.value, 10))}>
                                    <option value={RoomTradeModeEnum.Disabled}>{t('navigator.roomsettings.trade_not_allowed', 'Not allowed')}</option>
                                    <option value={RoomTradeModeEnum.RoomOwnerAndRights}>{t('navigator.roomsettings.trade_not_with_Controller', 'Owner only')}</option>
                                    <option value={RoomTradeModeEnum.Everyone}>{t('navigator.roomsettings.trade_allowed', 'Everyone')}</option>
                                </select>
                            </Border>
                        </div>
                    </div>
                    <Border variant="6" className="navigator-creator-models" blend={0.5}>
                        <ScrollArea variant="3" contentClassName="navigator-creator-model-grid">
                            {models.map(model => {
                                const locked = model.clubLevel > clubLevel;

                                return (
                                    <div
                                        key={model.name}
                                        className={cn('navigator-creator-model', modelName === model.name && 'is-selected')}
                                        role="button"
                                        tabIndex={0}
                                        aria-disabled={locked || undefined}
                                        title={`${model.tileSize} ${t('navigator.createroom.tilesize', 'tiles')}`}
                                        onClick={() => !locked && setModelName(model.name)}>
                                        <img src={GetRoomModelImageUrl(model.name)} alt={model.name} />
                                        <span className="navigator-creator-model-size">{model.tileSize}</span>
                                    </div>
                                );
                            })}
                        </ScrollArea>
                    </Border>
                    {!canCreateRoom && (
                        <div className="navigator-creator-label">
                            {t('navigator.createroom.maxroomsreached.info', 'You have reached your room limit', { amount: String(createdRoomLimit) })}
                        </div>
                    )}
                    <div className="navigator-creator-buttons">
                        <Button variant="3" className="navigator-creator-button" onClick={() => setIsCreatorOpen(false)}>
                            {t('generic.cancel', 'Cancel')}
                        </Button>
                        <Button variant="5" className="navigator-creator-button" disabled={!canSubmit} onClick={submit}>
                            {t('navigator.createroom.create', 'Create')}
                        </Button>
                    </div>
                </div>
            </Frame>
        </div>
    );
}
