import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export function Mark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect x="1" y="1" width="30" height="30" rx="8" fill="#234e48" />
      <path d="M10 11.5h12M10 16h12M10 20.5h7" stroke="#f6f1e6" strokeWidth="2" strokeLinecap="round" />
      <circle cx="22" cy="20.5" r="2.4" stroke="#c97a4a" strokeWidth="1.6" fill="none" />
    </svg>
  );
}

export function IconSend(p: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...p}>
      <path d="M2 8l12-6-4 14-2.5-5.5L2 8z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

export function IconPdf(p: IconProps) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" {...p}>
      <path d="M3.5 2h6L13 5.5V14H3.5V2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M9.5 2v3.5H13" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <text x="5" y="12" fontSize="3.6" fontFamily="var(--mono)" fill="currentColor" fontWeight="600">PDF</text>
    </svg>
  );
}

export function IconUpload(p: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...p}>
      <path d="M8 11V3M5 6l3-3 3 3M2.5 11.5V13a1 1 0 001 1h9a1 1 0 001-1v-1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconRefresh(p: IconProps) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" {...p}>
      <path d="M2 7.5A6 6 0 0113.5 6M14 8.5A6 6 0 012.5 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M11 6h2.5V3.5M5 10H2.5V12.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconShield(p: IconProps) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" {...p}>
      <path d="M8 1.5l5.5 1.8v4.2c0 3.4-2.3 6.1-5.5 7-3.2-.9-5.5-3.6-5.5-7V3.3L8 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M5.5 8.2l1.8 1.8 3.2-3.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconLogout(p: IconProps) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" {...p}>
      <path d="M9 11.5v1.5a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1h5a1 1 0 011 1v1.5M6 8h8M11 5l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconSearch(p: IconProps) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" {...p}>
      <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function IconBookmark(p: IconProps) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" {...p}>
      <path d="M3.5 2h9v12L8 11l-4.5 3V2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

export function IconCopy(p: IconProps) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" {...p}>
      <rect x="5" y="5" width="9" height="9" rx="1.4" stroke="currentColor" strokeWidth="1.3" />
      <path d="M3 11V3a1 1 0 011-1h7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function IconThumb(p: IconProps) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" {...p}>
      <path d="M5 7h-2v6h2M5 7l3-5c1 0 1.5.5 1.5 1.5L9 6h3.5a1.5 1.5 0 011.5 1.7l-.7 4A1.5 1.5 0 0111.8 13H5V7z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

export function IconClock(p: IconProps) {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" {...p}>
      <circle cx="8" cy="8" r="6.2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 4.5V8l2.4 1.6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function IconSpark(p: IconProps) {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" {...p}>
      <path d="M8 1.5l1.6 4.4L14 7.5l-4.4 1.6L8 13.5l-1.6-4.4L2 7.5l4.4-1.6L8 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

export function IconPlus(p: IconProps) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" {...p}>
      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconChev(p: IconProps) {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" {...p}>
      <path d="M5 6l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconDoc(p: IconProps) {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" {...p}>
      <path d="M4 2h6l3 3v9H4V2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M10 2v3h3" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M6 8h5M6 10.5h5M6 13h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function IconExternal(p: IconProps) {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" {...p}>
      <path d="M9 2h5v5M14 2L7 9M12 9v4a1 1 0 01-1 1H3a1 1 0 01-1-1V5a1 1 0 011-1h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconPin(p: IconProps) {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" {...p}>
      <path d="M10.5 2L14 5.5l-3 .8-3.2 3.2-1.8-.4L4 11.5 1.5 14M9 9.5l.5 4M6.5 7L2.5 6.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconArrowRight(p: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...p}>
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconUser(p: IconProps) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" {...p}>
      <circle cx="8" cy="5.5" r="2.6" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2.5 13.5c.9-2.4 3-3.7 5.5-3.7s4.6 1.3 5.5 3.7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function IconLock(p: IconProps) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" {...p}>
      <rect x="3" y="7" width="10" height="7" rx="1.4" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5 7V5a3 3 0 116 0v2" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

export function IconEye(p: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...p}>
      <path d="M1.5 8s2.4-4.5 6.5-4.5S14.5 8 14.5 8 12.1 12.5 8 12.5 1.5 8 1.5 8z" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

export function IconEyeOff(p: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...p}>
      <path d="M2 2l12 12M6.4 6.5C5.5 7 5 7.6 5 8.4c0 1.5 1.3 2.6 2.8 2.6.8 0 1.5-.3 2-.8M9.6 5.6c1.6.4 2.9 1.6 3.4 2.4 0 0-1 1.7-2.5 2.7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M1.5 8.4S3.9 4 8 4c.7 0 1.4.1 2 .3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
