import { memo } from 'react';

import type { BitmapTextProps } from './types';
import { useBitmapText } from './useBitmapText';

const BitmapTextComponent = (props: BitmapTextProps) => {
    const {
        children,
        recipe,
        color,
        align = 'left',
        autoWidth = false,
        wrap = false,
        lineHeight,
        shadowColor,
        shadowX = 0,
        shadowY = 0,
        className = '',
    } = props;
    const text = String(children ?? '');
    const { containerRef, canvasRef } = useBitmapText({
        text,
        recipe,
        color,
        align,
        autoWidth,
        wrap,
        lineHeight,
        shadowColor,
        shadowX,
        shadowY,
    });

    return (
        <span ref={containerRef} className={className}>
            <canvas
                ref={canvasRef}
                aria-hidden="true"
                data-bitmap-status="loading"
                className="pointer-events-none absolute top-0 left-0 block pixel-art"
            />
            <span className="sr-only">{text}</span>
        </span>
    );
};

export const BitmapText = memo(BitmapTextComponent);

BitmapText.displayName = 'BitmapText';
