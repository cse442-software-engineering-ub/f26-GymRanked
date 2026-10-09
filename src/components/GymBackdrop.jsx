import './GymBackdrop.css';

// A gym photo band for the top of a page (DESIGN.md, "Gym backdrop").
// image: a file in public/backdrops/, e.g. "backdrops/rack.webp". Without one, the band is plain dark.
// height / phoneHeight: band height in px on computers and on phones (640px wide or less).
// children: what sits on the band, e.g. the logo at the top and a step indicator on the dark lower edge.
export default function GymBackdrop({ image, height = 220, phoneHeight = 168, children }) {
  const style = {
    '--backdrop-height': `${height}px`,
    '--backdrop-height-phone': `${phoneHeight}px`,
  };
  if (image) style['--backdrop-image'] = `url("${import.meta.env.BASE_URL}${image}")`;

  // The photo is decoration (a CSS background), so the page still makes sense if it fails to load.
  return (
    <div className="gym-backdrop" style={style}>
      <div className="gym-backdrop__content">{children}</div>
    </div>
  );
}
