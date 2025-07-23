import React, {
  type ComponentPropsWithoutRef,
  type CSSProperties,
} from "react";

interface RippleProps extends ComponentPropsWithoutRef<"div"> {
  mainCircleSize?: number;
  mainCircleOpacity?: number;
  numCircles?: number;
}

export const Ripple = React.memo(function Ripple({
  mainCircleSize = 210,
  mainCircleOpacity = 0.24,
  numCircles = 8,
  ...props
}: RippleProps) {
  return (
    <div
      className="pointer-events-none absolute text-white  inset-0 select-none [mask-image:linear-gradient(to_bottom,white,transparent)]"
      {...props}
    >
     
      {Array.from({ length: numCircles }, (_, i) => {
        const size = mainCircleSize + i * 70;
        const opacity = mainCircleOpacity - i * 0.03;
        const animationDelay = `${i * 0.06}s`;

        return (
          <div
            key={i}
            className="absolute text-white bg-gray-600 animate-ripple rounded-full border  shadow-xl"
            style={
              {
                "--i": i,
                width: `${size}px`,
                height: `${size}px`,
                opacity,
                animationDelay,
                borderStyle: "solid",
                borderWidth: "1px",
                borderColor: `var(--foreground)`,
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%) scale(1)",
                boxShadow: "0 0 12px rgba(0, 255, 128, 0.15)",
              } as CSSProperties
            }
          />
        );
      })}

    
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div className="text-white text-base font-semibold">Connecting...</div>
      </div>
    </div>
  );
});

Ripple.displayName = "Ripple";
