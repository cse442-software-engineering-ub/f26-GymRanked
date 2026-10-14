export default function MobileDashboardIcon({ name, className = '' }) {
  const paths = {
    dumbbell: <><path d="M3 9v6m3-9v12m3-7h6m3-5v12m3-9v6" /></>,
    trophy: <><path d="M7 4h10v7a5 5 0 0 1-10 0V4Zm0 2H4v3a4 4 0 0 0 3 4m10-7h3v3a4 4 0 0 1-3 4M12 16v4m-4 0h8" /></>,
    calendar: <><rect x="4" y="5" width="16" height="16" rx="2" /><path d="M8 3v4m8-4v4M4 10h16M8 14h1m5 0h1m-7 4h1m5 0h1" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l4 2" /></>,
    chevron: <path d="m9 5 7 7-7 7" />,
    home: <><path d="m3 10 9-7 9 7v10H3V10Z" /><path d="M9 20v-7h6v7" /></>,
    progress: <><path d="M5 20v-5m7 5V9m7 11V4" /></>,
    today: <><rect x="4" y="5" width="16" height="16" rx="2" /><path d="M8 3v4m8-4v4M4 10h16m5 5h6" /></>,
    logout: <><path d="M10 4H4v16h6m4-12 4 4-4 4m-8-4h12" /></>,
  }

  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}
