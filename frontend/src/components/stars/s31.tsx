export default function Star31({
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
        d="M110.83 109.968c86.446 139.251-10.83 85.773-10.83-5.984 0 91.662-97.276 145.235-10.83 5.984-86.446 139.251-67.922 25.931 2.09-12.633-69.917 38.469-148.669-41.795-8.74-8.93-139.929-32.865-31.158-49.392 12.065-1.804C51.362 39.013 100-64.143 100 75.108c0-139.251 48.638-36.095 5.415 11.493 43.223-47.588 151.994-31.06 12.064 1.805 139.93-32.866 61.178 47.398-8.739 8.929 69.917 38.469 88.536 151.884 2.09 12.633"
      />
    </svg>
  )
}
