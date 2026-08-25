import { useRef, useState } from "react";

import { useOutsideClick } from "#base/hooks";
import { Border, Dropmenu, DropmenuItem } from "#base/theme";

type InventoryFilterSelectProps<T extends string> = {
    value: T;
    options: T[];
    getLabel: (option: T) => string;
    onChange: (option: T) => void;
    className?: string;
}

/**
 * `inventory.xml` renders these as `dropmenu` controls 119x21. The open list is a
 * plain bordered panel - `Droplist` stamps its own dropdown arrow overlay, which
 * belongs on the closed control, not on the expanded options.
 */
export const InventoryFilterSelect = <T extends string,>(props: InventoryFilterSelectProps<T>) => {
    const { value, options, getLabel, onChange, className } = props;
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useOutsideClick(containerRef, () => setIsOpen(false), isOpen);

    return (
        <div ref={containerRef} className="relative">
            <Dropmenu
                variant="100"
                className={className}
                onClick={() => setIsOpen(x => !x)}>
                <span className="block truncate pr-4 pl-1 leading-5">{getLabel(value)}</span>
            </Dropmenu>
            {isOpen && (
                <Border variant="0" className="absolute top-full left-0 z-20 flex w-max min-w-full flex-col p-0.5">
                    {options.map(option => (
                        <DropmenuItem
                            key={option}
                            variant="100"
                            aria-selected={option === value}
                            className="block w-full cursor-pointer whitespace-nowrap text-left"
                            onClick={() => {
                                onChange(option);
                                setIsOpen(false);
                            }}>
                            {getLabel(option)}
                        </DropmenuItem>
                    ))}
                </Border>
            )}
        </div>
    );
}
