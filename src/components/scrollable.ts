import { Focusable } from '../abstract/focusable.js';
import { RichChar } from '../richchar.js';
import { RichCharGrid } from '../richchargrid.js';
import { Container, ContainerAttributes } from './container.js';
import type { Minitel } from './minitel.js';

export class Scrollable extends Container<ScrollableAttributes, { key: [string] }> implements Focusable {
    static defaultAttributes: ScrollableAttributes = {
        ...Container.defaultAttributes,
        overflowX: 'hidden',
        overflowY: 'auto',
        autofocus: false,
    };
    defaultAttributes = Scrollable.defaultAttributes;
    scrollDeltaX = 0;
    scrollDeltaY = 0;
    focused = false;
    disabled = false;
    keepElmDesc: true = true;
    constructor(children = [], attributes: Partial<ScrollableAttributes>, minitel: Minitel) {
        super(children, attributes, minitel);

        this.on('key', (str) => {
            console.log(str);
            switch (str) {
                case '\x1b\x5b\x41': // up
                    this.scrollDeltaY -= 1;
                    this.minitel.queueImmediateRenderToStream();
                    break;
                case '\x1b\x5b\x42': // down
                    this.scrollDeltaY += 1;
                    this.minitel.queueImmediateRenderToStream();
                    break;
                case '\x1b\x5b\x43': // right
                    this.scrollDeltaX += 1;
                    this.minitel.queueImmediateRenderToStream();
                    break;
                case '\x1b\x5b\x44': // left
                    this.scrollDeltaX -= 1;
                    this.minitel.queueImmediateRenderToStream();
                    break;
            }
        });
    }
    render(attributes: ScrollableAttributes, inheritMe: Partial<ScrollableAttributes>) {
        // now its 3 am and i don't know how i'll read back
        // this code it's such a mess

        const fillChar = new RichChar(attributes.fillChar, this.attributes);

        let render: RichCharGrid;

        let autoedX = false;
        let autoedY = false;

        if (attributes.width == null && attributes.height == null) {
            render = super.render(attributes, inheritMe);
        } else if (attributes.overflowY !== 'hidden') {
            if (attributes.height == null) {
                render = super.render(attributes, inheritMe);
            } else {
                if (attributes.overflowY === 'auto') {
                    const possibleRender = super.render({
                        ...attributes,
                        width: attributes.overflowX === 'hidden' ? attributes.width : null,
                        height: null,
                    }, inheritMe);
                    if (possibleRender.height <= attributes.height) {
                        render = possibleRender;
                        autoedY = true;
                    }
                }

                if (!autoedY) {
                    const width = attributes.width != null && attributes.overflowX === 'hidden'
                        ? attributes.width - 1
                        : null;
        
                    render = super.render({ ...attributes, width, height: null }, inheritMe);
                }
            }
        } else {
            if (attributes.width == null) {
                render = super.render(attributes, inheritMe);
            } else {
                if (attributes.overflowX === 'auto') {
                    const possibleRender = super.render({
                        ...attributes,
                        height: attributes.height,
                        width: null,
                    }, inheritMe);
                    if (possibleRender.width <= attributes.width) {
                        render = possibleRender;
                        autoedX = true;
                    }
                }

                if (!autoedX) {
                    const height = attributes.height != null ? attributes.height - 1 : null;
        
                    render = super.render({ ...attributes, height, width: null }, inheritMe);
                }
            }
        }
        const finalRender = render!; // Source: Trust me bro

        const originalWidth = finalRender.width;
        const originalHeight = finalRender.height;

        const maxScrollSizeX = attributes.overflowY !== 'hidden' && !autoedY && attributes.width != null
            ? attributes.width - 1
            : attributes.width; // Area available for scroll for bottom scroll bar

        const scrollbarSizeX = attributes.width && Math.ceil(maxScrollSizeX! * attributes.width / originalWidth);
        this.scrollDeltaX = Math.min(Math.max(0, this.scrollDeltaX), scrollbarSizeX || 0);

        const maxScrollSizeY = attributes.overflowX !== 'hidden' && !autoedX && attributes.height != null
            ? attributes.height - 1
            : attributes.height; // Area available for scroll for right scroll bar

        const scrollbarSizeY = attributes.height && Math.ceil(maxScrollSizeY! * attributes.height / originalHeight);
        this.scrollDeltaY = Math.min(Math.max(0, this.scrollDeltaY), scrollbarSizeY || 0);

        if (attributes.height != null) {
            const ratioFromOneAnother = originalHeight / (attributes.height - scrollbarSizeY!);

            finalRender.cutHeight(Math.min(attributes.height + Math.round(this.scrollDeltaY * ratioFromOneAnother), originalHeight), 'end');
            finalRender.cutHeight(maxScrollSizeY!, 'start');
        }
        if (attributes.width != null) {
            const ratioFromOneAnother = originalWidth / (attributes.width - scrollbarSizeX!);

            finalRender.cutWidth(Math.min(attributes.width + Math.round(this.scrollDeltaX * ratioFromOneAnother), originalWidth), 'end');
            finalRender.cutWidth(maxScrollSizeX!, 'start');
        }

        const scrollChar = new RichChar('\x7f', { ...attributes, noBlink: !this.focused });

        if (attributes.overflowY !== 'hidden' && !autoedY && attributes.height != null) {
            const rightScrollbar = RichCharGrid.fill(1, scrollbarSizeY!, scrollChar);

            rightScrollbar.setHeight(scrollbarSizeY! + this.scrollDeltaY, 'start', fillChar);
            rightScrollbar.setHeight(finalRender.height, 'end', fillChar);

            finalRender.mergeX(rightScrollbar);
        }
        if (attributes.overflowX !== 'hidden' && !autoedX && attributes.width != null) {
            const bottomScrollbar = RichCharGrid.fill(scrollbarSizeX!, 1, scrollChar);

            bottomScrollbar.setWidth(scrollbarSizeX! + this.scrollDeltaX, 'start', fillChar);
            bottomScrollbar.setWidth(finalRender.height, 'end', fillChar);

            finalRender.mergeY(bottomScrollbar);
        }

        return finalRender;
    }
}

export interface ScrollableAttributes extends ContainerAttributes {
    overflowX: 'scroll' | 'pad' | 'auto' | 'hidden';
    overflowY: 'scroll' | 'pad' | 'auto' | 'hidden';
    autofocus: false;
}