import { paintBitmapTextBlock } from './bitmapTextPainter';
import type { BitmapTextAlign, LoadedBitmapFont } from './types';

const tintBitmapTextMask = (
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
    color: string,
) => {
    context.globalCompositeOperation = 'source-in';
    context.fillStyle = color;
    context.fillRect(0, 0, width, height);
    context.globalCompositeOperation = 'source-over';
};

type RenderBitmapTextCanvasOptions = {
    canvas: HTMLCanvasElement;
    scratch?: HTMLCanvasElement;
    font: LoadedBitmapFont;
    text: string;
    width: number;
    height: number;
    align: BitmapTextAlign;
    color: string;
    wrap: boolean;
    lineHeight?: number;
    shadowColor?: string;
    shadowX: number;
    shadowY: number;
};

const resizeCanvas = (canvas: HTMLCanvasElement, width: number, height: number) => {
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;

    const cssWidth = `${width}px`;
    const cssHeight = `${height}px`;

    if (canvas.style.width !== cssWidth) canvas.style.width = cssWidth;
    if (canvas.style.height !== cssHeight) canvas.style.height = cssHeight;
};

export const renderBitmapTextCanvas = (options: RenderBitmapTextCanvasOptions) => {
    const {
        canvas,
        scratch,
        font,
        text,
        width,
        height,
        align,
        color,
        wrap,
        lineHeight,
        shadowColor,
        shadowX,
        shadowY,
    } = options;

    resizeCanvas(canvas, width, height);

    const context = canvas.getContext('2d', { alpha: true });

    if (!context) return false;

    const resolvedLineHeight = Math.max(
        1,
        Math.round(lineHeight ?? font.metrics.lineHeight),
    );
    const paintMask = (target: CanvasRenderingContext2D) =>
        paintBitmapTextBlock(
            target,
            font,
            text,
            width,
            height,
            align,
            wrap,
            resolvedLineHeight,
        );

    context.clearRect(0, 0, width, height);
    context.imageSmoothingEnabled = false;

    if (!shadowColor) {
        paintMask(context);
        tintBitmapTextMask(context, width, height, color);
        return true;
    }

    if (!scratch) return false;

    resizeCanvas(scratch, width, height);

    const scratchContext = scratch.getContext('2d', { alpha: true });

    if (!scratchContext) return false;

    paintMask(scratchContext);
    tintBitmapTextMask(scratchContext, width, height, shadowColor);
    context.drawImage(scratch, shadowX, shadowY);
    paintMask(scratchContext);
    tintBitmapTextMask(scratchContext, width, height, color);
    context.drawImage(scratch, 0, 0);

    return true;
};
