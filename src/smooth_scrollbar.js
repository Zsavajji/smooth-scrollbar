/**
 * @module
 * @export {Class} SmoothScrollbar
 * @dependencies [ DEFAULT_OPTIONS, motionBuilder, debounce, findChild ]
 */

import { motionBuilder, debounce, findChild, setStyle } from './utils/index';
import { sbList } from './shared/sb_list';

const DEFAULT_OPTIONS = {
    SPEED: 1, // scroll speed scale
    STEP_LENGTH: 50, // wheel scroll step length (px/delta)
    PROPAGATION: true, // event propagation
    EASING_DURATION: 1e3, // swipe easing duration (ms)
    EASING_CURVE: 'cubic-bezier(0.1, 0.57, 0.1, 1)' // cubic bezier easing function
};

/**
 * @constructor
 * Create scrollbar instance
 *
 * @param {Element} container: target element
 * @param {Object} [options]: options, include four propertier:
 *          {Number} [speed]: scrolling speed, default is 1
 *          {Number} [stepLength]: scroll length per delta/keydown, default is 50
 *          {Number} [easingDuration]: swipe easing duration, default is 1000(ms)
 *          {String} [easingCurve]: easing timing function, defalut is cubic-bezier(0.1, 0.57, 0.1, 1)
 *          {Boolean} [propagation]: event propagation, default is true
 */
export class SmoothScrollbar {
    constructor(container, { speed, stepLength, easingDuration, easingCurve, propagation } = {}) {
        sbList.set(container, this);

        // make container focusable
        container.setAttribute('tabindex', '1');

        // reset scroll position
        container.scrollTop = container.scrollLeft = 0;

        setStyle(container, {
            overflow: 'hidden',
            outline: 'none'
        });

        const trackX = findChild(container, 'scrollbar-track-x');
        const trackY = findChild(container, 'scrollbar-track-y');

        // readonly properties
        this.__readonly('targets', Object.freeze({
            container,
            content: findChild(container, 'scroll-content'),
            xAxis: Object.freeze({
                track: trackX,
                thumb: findChild(trackX, 'scrollbar-thumb-x')
            }),
            yAxis: Object.freeze({
                track: trackY,
                thumb: findChild(trackY, 'scrollbar-thumb-y')
            })
        }))
        .__readonly('offset', {
            x: 0,
            y: 0
        })
        .__readonly('limit', {
            x: Infinity,
            y: Infinity
        })
        .__readonly('size', this.getSize())
        .__readonly('eventPropagation', propagation === undefined ? DEFAULT_OPTIONS.PROPAGATION : propagation);

        // non-enmurable properties
        Object.defineProperties(this, {
            __roundOffset: {
                value: debounce(() => {
                    const { x, y } = this.offset;

                    this.setPosition(Math.round(x), Math.round(y));
                })
            },
            __motionBuilder: {
                value: motionBuilder(easingCurve || DEFAULT_OPTIONS.EASING_CURVE)
            },
            __updateThrottle: {
                value: debounce(::this.update)
            },
            __listeners: {
                value: []
            },
            __handlers: {
                value: []
            },
            __children: {
                value: []
            },
            __timerID: {
                value: {}
            }
        });

        this.__initScrollbar({
            speed: parseFloat(speed) || DEFAULT_OPTIONS.SPEED,
            stepLength: parseFloat(stepLength) || DEFAULT_OPTIONS.STEP_LENGTH,
            easingDuration: parseFloat(easingDuration) || DEFAULT_OPTIONS.EASING_DURATION
        });
    }
}