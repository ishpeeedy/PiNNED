export default function Star19({
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
        d="M100 5C86.883 5 76.25 15.633 76.25 28.75v47.5h-47.5C15.633 76.25 5 86.883 5 100s10.633 23.75 23.75 23.75h47.5v47.5C76.25 184.367 86.883 195 100 195s23.75-10.633 23.75-23.75v-47.5h47.5c13.117 0 23.75-10.633 23.75-23.75s-10.633-23.75-23.75-23.75h-47.5v-47.5C123.75 15.633 113.117 5 100 5"
        clipRule="evenodd"
        fillRule="evenodd"
      />
    </svg>
  )
}
