export function BrandLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="14" cy="14" r="5" fill="#A67C52" />
      <circle cx="6" cy="8" r="3" fill="#A67C52" opacity="0.7" />
      <circle cx="22" cy="8" r="3.5" fill="#A67C52" opacity="0.85" />
      <circle cx="5" cy="20" r="2.5" fill="#7A9B7F" opacity="0.8" />
      <circle cx="22" cy="20" r="2" fill="#7A9B7F" opacity="0.7" />
      <circle cx="14" cy="4" r="2" fill="#A67C52" opacity="0.5" />
      <line x1="14" y1="14" x2="6" y2="8" stroke="#C9B8A8" strokeWidth="1" />
      <line x1="14" y1="14" x2="22" y2="8" stroke="#C9B8A8" strokeWidth="1" />
      <line x1="14" y1="14" x2="5" y2="20" stroke="#C9B8A8" strokeWidth="1" />
      <line x1="14" y1="14" x2="22" y2="20" stroke="#C9B8A8" strokeWidth="1" />
      <line x1="14" y1="14" x2="14" y2="4" stroke="#C9B8A8" strokeWidth="1" />
      <line x1="6" y1="8" x2="14" y2="4" stroke="#C9B8A8" strokeWidth="0.75" />
    </svg>
  )
}
