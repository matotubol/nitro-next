import { layoutBitmapText } from './bitmapTextLayout';
import { wrapBitmapText } from './bitmapTextWrapping';
import type { BitmapTextAlign, LoadedBitmapFont } from './types';

const paintLine = (
    context: CanvasRenderingContext2D,
    font: LoadedBitmapFont,
    text: string,
    width: number,
    height: number,
    align: BitmapTextAlign,
    offsetY: number,
) => {
    const { image, metrics } = font;
    const usesFlashCoordinates = metrics.coordinateMode === 'flash-text-field';
    const baseline =
        Math.round((height - metrics.ascent - metrics.descent) / 2) +
        Math.floor(
            Math.max(0, metrics.lineHeight - metrics.ascent - metrics.descent) / 2,
        ) +
        metrics.ascent;
    const layout = layoutBitmapText(metrics, text);
    const lineStart =
        align === 'center'
            ? (width - layout.width) / 2
            : align === 'right'
              ? width - layout.width
              : 0;

    for (const { glyph, x } of layout.glyphs) {
        if (glyph.width <= 0 || glyph.height <= 0) continue;

        const destinationY =
            offsetY +
            (usesFlashCoordinates && Number.isFinite(glyph.fieldTop)
                ? Number(glyph.fieldTop)
                : baseline + (glyph.yOffset ?? 0));

        context.drawImage(
            image,
            glyph.x,
            glyph.y,
            glyph.width,
            glyph.height,
            usesFlashCoordinates ? lineStart + x : Math.round(lineStart + x),
            usesFlashCoordinates ? destinationY : Math.round(destinationY),
            glyph.width,
            glyph.height,
        );
    }
};

export const paintBitmapTextBlock = (
    context: CanvasRenderingContext2D,
    font: LoadedBitmapFont,
    text: string,
    width: number,
    height: number,
    align: BitmapTextAlign,
    wrap: boolean,
    lineHeight: number,
) => {
    context.clearRect(0, 0, width, height);
    context.imageSmoothingEnabled = false;

    const lines = wrap ? wrapBitmapText(font.metrics, text, width) : [text];
    const textLineHeight = wrap ? lineHeight : height;

    for (let index = 0; index < lines.length; index++) {
        const offsetY = wrap ? index * lineHeight : 0;

        if (offsetY >= height) break;

        paintLine(context, font, lines[index], width, textLineHeight, align, offsetY);
    }
};
