import { IOutgoingPacket } from '@nitrodevco/nitro-api';

export type UpdateFigureDataComposerType = {
    gender: string;
    figure: string;
};

export class UpdateFigureDataComposer implements IOutgoingPacket<UpdateFigureDataComposerType> {
    public constructor(private params: UpdateFigureDataComposerType) {}

    public compose(): (number | string | boolean)[] {
        return [this.params.gender, this.params.figure];
    }
}
