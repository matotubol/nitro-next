import { layoutBitmapText } from './bitmapTextLayout';
import { renderBitmapTextCanvas } from './bitmapTextRenderer';
import type { BitmapTextAlign, LoadedBitmapFont } from './types';

export type BitmapTextDrawingOptions = {
    text: string;
    color: string;
    align: BitmapTextAlign;
    autoWidth: boolean;
    wrap: boolean;
    lineHeight?: number;
    shadowColor?: string;
    shadowX: number;
    shadowY: number;
};

export const releaseBitmapTextCanvas = (canvas: HTMLCanvasElement | null) => {
    if (!canvas) return;

    canvas.width = 0;
    canvas.height = 0;
};

export const renderBitmapTextElement = (
    container: HTMLSpanElement,
    canvas: HTMLCanvasElement,
    scratch: HTMLCanvasElement | null,
    font: LoadedBitmapFont,
    options: BitmapTextDrawingOptions,
) => {
    const {
        text,
        color,
        align,
        autoWidth,
        wrap,
        lineHeight,
        shadowColor,
        shadowX,
        shadowY,
    } = options;
    const width = autoWidth
        ? Math.ceil(
              layoutBitmapText(font.metrics, text).width +
                  (font.metrics.fieldGutterX ?? 0) * 2,
          )
        : Math.floor(container.clientWidth);
    const height = Math.floor(container.clientHeight);

    if (autoWidth) {
        const cssWidth = `${width}px`;

        if (container.style.width !== cssWidth) container.style.width = cssWidth;
    } else if (container.style.width) {
        container.style.removeProperty('width');
    }

    let renderScratch = scratch;

    if (!shadowColor && renderScratch) {
        releaseBitmapTextCanvas(renderScratch);
        renderScratch = null;
    }

    if (width <= 0 || height <= 0) return renderScratch;

    if (shadowColor && !renderScratch) {
        renderScratch = document.createElement('canvas');
    }

    if (
        renderBitmapTextCanvas({
            canvas,
            scratch: renderScratch ?? undefined,
            font,
            text,
            width,
            height,
            align,
            color,
            wrap: wrap && !autoWidth,
            lineHeight,
            shadowColor,
            shadowX,
            shadowY,
        })
    ) {
        canvas.dataset.bitmapStatus = 'ready';
    }

    return renderScratch;
};
