import "./StarBorder.css";

const StarBorder = ({
  as: Component = "div",
  className = "",
  color = "orange",
  speed = "0.s",          // how fast when hovering
  thickness = 6,           // ✅ thicker border
  radius = 18,
  hoverOnly = true,        // ✅ animate only on hover
  children,
  style,
  ...rest
}) => {
  return (
    <Component
      className={`star-border-container ${hoverOnly ? "hover-only" : ""} ${className}`}
      style={{
        borderRadius: radius,
        padding: thickness,
        ...style
      }}
      {...rest}
    >
      <div
        className="border-gradient-bottom"
        style={{
          background: `radial-gradient(circle, ${color} 0%, transparent 55%)`,
          animationDuration: speed,
          borderRadius: radius
        }}
      />
      <div
        className="border-gradient-top"
        style={{
          background: `radial-gradient(circle, ${color} 0%, transparent 55%)`,
          animationDuration: speed,
          borderRadius: radius
        }}
      />

      <div className="inner-content" style={{ borderRadius: radius - 2 }}>
        {children}
      </div>
    </Component>
  );
};

export default StarBorder;