type P = { d: string | string[]; className?: string };

function Icon({ d, className }: P) {
  const ds = Array.isArray(d) ? d : [d];
  return (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      {ds.map((p) => (
        <path key={p} d={p} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </svg>
  );
}

export const BellIcon = ({ className }: { className?: string }) => (
  <Icon
    className={className}
    d={[
      "M4.47254 9.40225C4.94336 5.60292 8.17163 2.75 12 2.75C15.8284 2.75 19.0567 5.60291 19.5275 9.40224L20.2217 15.004C20.3695 16.1971 19.439 17.25 18.2369 17.25H5.76317C4.56102 17.25 3.63051 16.1971 3.77835 15.004L4.47254 9.40225Z",
      "M16 17.25C16 19.4591 14.2091 21.25 12 21.25C9.79086 21.25 8 19.4591 8 17.25",
    ]}
  />
);
export const SearchIcon = ({ className }: { className?: string }) => (
  <Icon className={className} d="m20.25 20.25-4.123-4.123m0 0A7.25 7.25 0 1 0 5.874 5.874a7.25 7.25 0 0 0 10.253 10.253" />
);
export const SunIcon = ({ className }: { className?: string }) => (
  <Icon className={className} d="M11.998 3.29V1.769M5.84 18.158l-1.077 1.078m7.235 2.997v-1.524m7.235-15.944-1.077 1.077M20.707 12h1.523m-4.074 6.159 1.077 1.077M1.766 12h1.523m1.474-7.235L5.84 5.842m9.87 2.446a5.25 5.25 0 1 1-7.424 7.424 5.25 5.25 0 0 1 7.424-7.424" />
);
export const MoonIcon = ({ className }: { className?: string }) => (
  <Icon className={className} d="M21.248 11.811a6.5 6.5 0 0 1-9.06-9.06L12 2.75a9.25 9.25 0 1 0 9.248 9.061" />
);
export const MonitorIcon = ({ className }: { className?: string }) => (
  <Icon
    className={className}
    d={[
      "M4.75 4.75h14.5a2 2 0 0 1 2 2v8.5a2 2 0 0 1-2 2H4.75a2 2 0 0 1-2-2v-8.5a2 2 0 0 1 2-2Z",
      "M8.25 20.25h7.5",
      "M12 17.25v3",
    ]}
  />
);
export const CopyIcon = ({ className }: { className?: string }) => (
  <Icon
    className={className}
    d={[
      "M8.75 8.75V5.75a2 2 0 0 1 2-2h7.5a2 2 0 0 1 2 2v7.5a2 2 0 0 1-2 2h-3",
      "M5.75 8.75h7.5a2 2 0 0 1 2 2v7.5a2 2 0 0 1-2 2h-7.5a2 2 0 0 1-2-2v-7.5a2 2 0 0 1 2-2Z",
    ]}
  />
);
export const TerminalIcon = ({ className }: { className?: string }) => (
  <Icon
    className={className}
    d={[
      "M4.75 5.75h14.5a1.5 1.5 0 0 1 1.5 1.5v9.5a1.5 1.5 0 0 1-1.5 1.5H4.75a1.5 1.5 0 0 1-1.5-1.5v-9.5a1.5 1.5 0 0 1 1.5-1.5Z",
      "m7.75 10 2.25 2-2.25 2",
      "M12.25 14h3.5",
    ]}
  />
);
export const ArrowRightIcon = ({ className }: { className?: string }) => <Icon className={className} d="M14 5.75 20.25 12 14 18.25M19.5 12H3.75" />;
export const ArrowUpRightIcon = ({ className }: { className?: string }) => <Icon className={className} d="M18.25 15.25V5.75M18.25 5.75H8.75M18.25 5.75L6 18" />;
