import type { AvatarFigurePartType, IAvatarFigureContainer } from "@nitrodevco/nitro-api";

export class AvatarFigureContainer implements IAvatarFigureContainer {
    private _parts: Map<AvatarFigurePartType, { type: AvatarFigurePartType, setId: number, colorIds: number[] }> = new Map();

    constructor(figure: string) {
        this.parseFigure(figure);
    }

    public getPartTypeIds(): AvatarFigurePartType[] {
        return this._parts.keys().toArray();
    }

    public hasPartType(type: AvatarFigurePartType): boolean {
        return !!this._parts.get(type);
    }

    public getPartSetId(type: AvatarFigurePartType): number {
        return this._parts.get(type)?.setId ?? 0;
    }

    public getPartColorIds(type: AvatarFigurePartType): number[] {
        return this._parts.get(type)?.colorIds ?? [];
    }

    public updatePart(type: AvatarFigurePartType, setId: number, colorIds: number[]): void {
        const existing = this._parts.get(type);

        // Update in place. Deleting first would move the part to the end of the map
        // and reorder getFigureString(), which callers compare against the figure
        // string the server sent them.
        if (existing) {
            existing.setId = setId;
            existing.colorIds = colorIds;

            return;
        }

        this._parts.set(type, {
            type,
            setId,
            colorIds
        });
    }

    public removePart(type: AvatarFigurePartType): void {
        this._parts.delete(type);
    }

    public getFigureString(): string {
        const parts: string[] = [];

        for (const key of this._parts.keys()) {
            if (!key) continue;

            let setParts: string[] = [];

            setParts.push(key);
            setParts.push(this.getPartSetId(key).toString());

            setParts = setParts.concat(this.getPartColorIds(key).map(x => x.toString()));

            parts.push(setParts.join('-'));
        }

        return parts.join('.');
    }

    private parseFigure(figure: string): void {
        if (!figure) figure = '';

        for (const part of figure.split('.')) {
            const pieces = part.split('-');

            if (pieces.length >= 2) {
                const type = pieces[0] as AvatarFigurePartType;
                const setId = parseInt(pieces[1]);
                const colorIds: number[] = [];

                let i = 2;

                while (i < pieces.length) {
                    const colorId = parseInt(pieces[i]);

                    // Colourless parts arrive with a trailing separator ("wa-2007-").
                    // Pushing the resulting NaN would poison palette lookups and emit
                    // "wa-2007-NaN" from getFigureString().
                    if (!isNaN(colorId)) colorIds.push(colorId);

                    i++;
                }

                this.updatePart(type, setId, colorIds);
            }
        }
    }
}
