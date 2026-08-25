import { IOutgoingPacket } from '@nitrodevco/nitro-api';

export type LetUserInComposerType = {
    name: string;
    canEnter: boolean;
};

export class LetUserInComposer implements IOutgoingPacket<LetUserInComposerType> {
    public constructor(private params: LetUserInComposerType) { }

    public compose(): (number | string | boolean)[] {
        return [
            this.params.name,
            this.params.canEnter,
        ];
    }
}
