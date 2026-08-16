import { useCallback, useLayoutEffect, useRef } from 'react';

import { loadBitmapFont } from './bitmapFontRegistry';
import {
    type BitmapTextDrawingOptions,
    releaseBitmapTextCanvas,
    renderBitmapTextElement,
} from './bitmapTextElementRenderer';
import { observeBitmapTextResize } from './bitmapTextResizeObserver';
import type { BitmapTextRecipe, LoadedBitmapFont } from './types';

type UseBitmapTextOptions = BitmapTextDrawingOptions & {
    recipe: BitmapTextRecipe;
};

export const useBitmapText = (options: UseBitmapTextOptions) => {
    const containerRef = useRef<HTMLSpanElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const scratchRef = useRef<HTMLCanvasElement>(null);
    const fontRef = useRef<LoadedBitmapFont>(null);
    const optionsRef = useRef(options);

    useLayoutEffect(() => {
        optionsRef.current = options;
    }, [options]);

    const draw = useCallback(() => {
        const container = containerRef.current;
        const canvas = canvasRef.current;
        const font = fontRef.current;

        if (!font || !container || !canvas) return;

        scratchRef.current = renderBitmapTextElement(
            container,
            canvas,
            scratchRef.current,
            font,
            optionsRef.current,
        );
    }, []);

    useLayoutEffect(() => {
        const container = containerRef.current;

        if (!container) return;

        return observeBitmapTextResize(container, draw);
    }, [draw]);

    useLayoutEffect(() => {
        let active = true;

        fontRef.current = null;

        if (canvasRef.current) {
            canvasRef.current.dataset.bitmapStatus = 'loading';
        }

        loadBitmapFont(options.recipe)
            .then(font => {
                if (!active) return;

                fontRef.current = font;
                draw();
            })
            .catch(error => {
                if (!active) return;
                if (canvasRef.current) canvasRef.current.dataset.bitmapStatus = 'error';
                console.error(error);
            });

        return () => {
            active = false;
        };
    }, [draw, options.recipe]);

    useLayoutEffect(draw, [
        draw,
        options.align,
        options.autoWidth,
        options.color,
        options.lineHeight,
        options.shadowColor,
        options.shadowX,
        options.shadowY,
        options.text,
        options.wrap,
    ]);

    useLayoutEffect(
        () => () => {
            releaseBitmapTextCanvas(scratchRef.current);
            releaseBitmapTextCanvas(canvasRef.current);
            scratchRef.current = null;
            fontRef.current = null;
        },
        [],
    );

    return { containerRef, canvasRef };
};
