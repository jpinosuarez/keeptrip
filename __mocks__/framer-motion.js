/**
 * Manual mock for framer-motion.
 * framer-motion is a heavy animation library not needed in unit tests.
 * This renders actual DOM elements (div, span, etc.) but strips animation props.
 */
import React from 'react';

const MOTION_PROPS = new Set([
  'initial', 'animate', 'exit', 'variants', 'transition',
  'whileHover', 'whileTap', 'whileFocus', 'whileInView', 'whileDrag',
  'layout', 'layoutId', 'drag', 'dragConstraints', 'dragElastic',
  'onAnimationStart', 'onAnimationComplete', 'onDragStart', 'onDragEnd',
  'custom', 'inherit', 'style',
]);

function filterMotionProps(props) {
  const filtered = {};
  for (const [key, value] of Object.entries(props)) {
    // Keep 'style' and standard HTML/React props, strip animation-only ones
    if (key === 'style' || key === 'className' || key === 'children' ||
        key === 'onClick' || key === 'onChange' || key === 'onSubmit' ||
        key === 'id' || key === 'role' || key === 'tabIndex' ||
        key === 'ref' || key === 'key' || key === 'type' ||
        key === 'htmlFor' || key === 'hidden' || key === 'disabled' ||
        key === 'placeholder' || key === 'value' || key === 'defaultValue' ||
        key === 'accept' || key === 'src' || key === 'alt' || key === 'href' ||
        key.startsWith('data-') || key.startsWith('aria-') ||
        key.startsWith('on')) {
      filtered[key] = value;
    }
  }
  return filtered;
}

const handler = {
  get(_target, tag) {
    if (tag === '__esModule') return true;
    const MotionComponent = React.forwardRef(function MotionStub(props, ref) {
      return React.createElement(tag, { ...filterMotionProps(props), ref });
    });
    MotionComponent.displayName = `motion.${tag}`;
    return MotionComponent;
  },
};

export const motion = new Proxy({}, handler);
export const AnimatePresence = ({ children }) => children ?? null;
export const useAnimation = () => ({ start: () => {}, stop: () => {} });
export const useMotionValue = (v) => ({ get: () => v, set: () => {} });
export const useTransform = () => ({ get: () => 0, set: () => {} });
export const useReducedMotion = () => false;
export const useSpring = () => ({ get: () => 0, set: () => {} });
