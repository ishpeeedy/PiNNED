export default function Star23({
  color,
  size,
  stroke,
  strokeWidth,
  pathClassName,
  width,
  height,
  ...props
}: React.SVGProps<SVGSVGElement> & {
  color?: string
  size?: number
  stroke?: string
  pathClassName?: string
  strokeWidth?: number
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 200 200"
      width={size ?? width}
      height={size ?? height}
      {...props}
    >
      <path
        fill={color ?? "currentColor"}
        stroke={stroke}
        strokeWidth={strokeWidth}
        className={pathClassName}
        d="M108.264 100c149.028 86.91 78.646 157.387-8.264 8.264C13.09 257.387-57.387 186.91 91.737 100-57.387 13.09 13.09-57.387 100 91.737 186.91-57.387 257.387 13.09 108.264 100"
      />
    </svg>
  )
}
