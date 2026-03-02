import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion";
import { Children, cloneElement, useEffect, useRef, useState } from "react";
import "./Dock.css";

function DockItem({
  children,
  className = "",
  onClick,
  mouseX,
  spring,
  distance,
  magnification,
  baseItemSize
}) {
  const ref = useRef(null);
  const isHovered = useMotionValue(0);

  const mouseDistance = useTransform(mouseX, (val) => {
    const rect = ref.current?.getBoundingClientRect() ?? { x: 0, width: baseItemSize };
    return val - rect.x - baseItemSize / 2;
  });

  const targetSize = useTransform(
    mouseDistance,
    [-distance, 0, distance],
    [baseItemSize, magnification, baseItemSize]
  );

  const size = useSpring(targetSize, spring);

  return (
    <motion.div
      ref={ref}
      style={{ width: size, height: size }}
      onHoverStart={() => isHovered.set(1)}
      onHoverEnd={() => isHovered.set(0)}
      onFocus={() => isHovered.set(1)}
      onBlur={() => isHovered.set(0)}
      onClick={onClick}
      className={`dock-item ${className}`}
      tabIndex={0}
      role="button"
    >
      {Children.map(children, (child) => cloneElement(child, { isHovered }))}
    </motion.div>
  );
}

function DockLabel({ children, className = "", ...rest }) {
  const { isHovered } = rest;
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const unsub = isHovered.on("change", (latest) => setIsVisible(latest === 1));
    return () => unsub();
  }, [isHovered]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: 1, y: -10 }}
          exit={{ opacity: 0, y: 0 }}
          transition={{ duration: 0.2 }}
          className={`dock-label ${className}`}
          role="tooltip"
          style={{ x: "-50%" }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DockIcon({ children, className = "" }) {
  return <div className={`dock-icon ${className}`}>{children}</div>;
}

export default function Dock({
  items,
  className = "",
  spring = { mass: 0.18, stiffness: 220, damping: 18 },
  magnification = 66,   // ✅ bigger pop
  distance = 160,
  panelHeight = 56,
  baseItemSize = 36     // ✅ smaller buttons
}) {
  const mouseX = useMotionValue(Infinity);
  const outerRef = useRef(null);

  // ✅ Smooth scroll-follow animation (dock moves slightly down smoothly)
  useEffect(() => {
    let rafId = null;
    let current = 0;
    let target = 0;

    const onScroll = () => {
      target = Math.min(window.scrollY * 0.12, 22); // max move 22px

      if (rafId) return;

      const animate = () => {
        current += (target - current) * 0.12;

        if (outerRef.current) {
          outerRef.current.style.transform = `translateY(${current}px)`;
        }

        if (Math.abs(target - current) > 0.2) {
          rafId = requestAnimationFrame(animate);
        } else {
          rafId = null;
        }
      };

      rafId = requestAnimationFrame(animate);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div ref={outerRef} className="dock-outer">
      <motion.div
        className={`dock-panel ${className}`}
        style={{ height: panelHeight }}
        onMouseMove={({ pageX }) => mouseX.set(pageX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        role="toolbar"
        aria-label="Floating dock"
      >
        {items.map((item, index) => (
          <DockItem
            key={index}
            onClick={item.onClick}
            className={item.className}
            mouseX={mouseX}
            spring={spring}
            distance={distance}
            magnification={magnification}
            baseItemSize={baseItemSize}
          >
            <DockIcon>{item.icon}</DockIcon>

            {/* keep label disabled */}
            <DockLabel>{item.label}</DockLabel>
          </DockItem>
        ))}
      </motion.div>
    </div>
  );
}