export default function Star33({
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
        d="M92.874 82.969C36.151-54.164 100 16.636 100 90.762c0-74.221 63.849-144.926 7.126-7.888 56.818-137.038 51.877-41.91-.57 10.548 52.447-52.458 147.65-57.305 10.546-.57 137.104-56.735 66.319 7.128-7.886 7.128 74.205 0 144.895 63.862 7.886 7.127 137.009 56.83 41.901 51.888-10.546-.57 52.447 52.458 57.293 147.682.57 10.549 56.723 137.133-7.126 66.333-7.126-7.888 0 74.221-63.849 144.926-7.126 7.888-56.818 137.038-51.877 41.909.57-10.549-52.447 52.458-147.65 57.305-10.546.57-137.104 56.735-66.32-7.127 7.886-7.127-74.205 0-144.895-63.863-7.886-7.128-137.009-56.83-41.901-51.888 10.546.57-52.447-52.363-57.293-147.586-.57-10.453"
      />
    </svg>
  )
}
