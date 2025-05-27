import * as React from "react"

const VisuallyHidden = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ ...props }, ref) => {
  return (
    <span
      ref={ref}
      {...props}
      style={{
        position: "absolute",
        border: 0,
        width: 1,
        height: 1,
        padding: 0,
        margin: -1,
        overflow: "hidden",
        clip: "rect(0, 0, 0, 0)",
        whiteSpace: "nowrap",
        wordWrap: "normal",
        ...props.style,
      }}
    />
  )
})
VisuallyHidden.displayName = "VisuallyHidden"

export { VisuallyHidden }