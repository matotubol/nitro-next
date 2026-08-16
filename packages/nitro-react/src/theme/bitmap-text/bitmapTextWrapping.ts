import { layoutBitmapText } from './bitmapTextLayout';
import type { BitmapFontMetrics } from './types';

const splitOversizedWord = (
    metrics: BitmapFontMetrics,
    word: string,
    width: number,
) => {
    const fragments: string[] = [];
    let fragment = '';

    for (const character of word) {
        const candidate = fragment + character;

        if (fragment && layoutBitmapText(metrics, candidate).width > width) {
            fragments.push(fragment);
            fragment = character;
        } else {
            fragment = candidate;
        }
    }

    if (fragment) fragments.push(fragment);

    return fragments;
};

export const wrapBitmapText = (
    metrics: BitmapFontMetrics,
    text: string,
    width: number,
) => {
    const lines: string[] = [];
    const fits = (value: string) => layoutBitmapText(metrics, value).width <= width;

    for (const paragraph of text.split(/\r?\n/)) {
        const words = paragraph.trim().split(/\s+/).filter(Boolean);
        let line = '';

        if (!words.length) {
            lines.push('');
            continue;
        }

        for (const word of words) {
            const candidate = line ? `${line} ${word}` : word;

            if (fits(candidate)) {
                line = candidate;
                continue;
            }

            if (line) lines.push(line);

            if (fits(word)) {
                line = word;
                continue;
            }

            const fragments = splitOversizedWord(metrics, word, width);

            lines.push(...fragments.slice(0, -1));
            line = fragments.at(-1) ?? '';
        }

        if (line) lines.push(line);
    }

    return lines;
};
