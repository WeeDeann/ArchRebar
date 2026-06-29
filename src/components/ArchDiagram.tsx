import { useMemo } from 'react';
import type { ArcGeometry, Point2D, SegmentParams } from '../engine';

interface Props {
  geometry: ArcGeometry;
  params: SegmentParams;
  barSize: number;
  format: (mm: number) => string;
  variant?: 'screen' | 'print';
}

/** Triangle points for a filled arrowhead whose tip is at `tip`, pointing in `dir` (radians). */
function arrowHead(tip: Point2D, dir: number, size: number): string {
  const a1 = dir + Math.PI - 0.4;
  const a2 = dir + Math.PI + 0.4;
  return [
    `${tip.x},${tip.y}`,
    `${tip.x + size * Math.cos(a1)},${tip.y + size * Math.sin(a1)}`,
    `${tip.x + size * Math.cos(a2)},${tip.y + size * Math.sin(a2)}`,
  ].join(' ');
}

const toPts = (pts: Point2D[]) => pts.map((p) => `${p.x},${p.y}`).join(' ');

/** Rough axis-aligned bounds for a dimension label (keeps viewBox from clipping text). */
function labelBounds(
  pos: Point2D,
  text: string,
  textSize: number,
  anchor: 'start' | 'middle' | 'end',
): { x0: number; x1: number; y0: number; y1: number } {
  const w = text.length * textSize * 0.58;
  const h = textSize * 1.25;
  let x0 = pos.x;
  let x1 = pos.x;
  if (anchor === 'middle') {
    x0 = pos.x - w / 2;
    x1 = pos.x + w / 2;
  } else if (anchor === 'start') {
    x1 = pos.x + w;
  } else {
    x0 = pos.x - w;
  }
  return { x0, x1, y0: pos.y - h, y1: pos.y + textSize * 0.15 };
}

/** A dimensioned engineering drawing of the arch. All geometry scales to the viewBox. */
export function ArchDiagram({ geometry, params, barSize, format, variant = 'screen' }: Props) {
  const isPrint = variant === 'print';
  const d = useMemo(() => {
    const { chord: c, rise: h, radius: R, centralAngle: theta, centerOffset: depth } = params;
    const L: Point2D = { x: -c / 2, y: 0 };
    const Rt: Point2D = { x: c / 2, y: 0 };
    const A: Point2D = { x: 0, y: -h };
    const C: Point2D = { x: 0, y: depth };

    // Show the centre + radius/angle construction only when it fits sensibly on the figure.
    const showCenter = depth <= 1.25 * c && R <= 2.6 * c;
    const showAngle = showCenter && depth > c * 0.02 && theta < Math.PI - 0.02;

    const S = Math.max(c, showCenter ? h + Math.max(0, depth) : h * 1.8, 1);
    const gap = S * 0.075;
    const textSize = S * 0.052;
    const arrow = S * 0.02;
    const objW = S * 0.0065;
    const thinW = S * 0.003;

    const chordDimY = -h - gap * 2.6;
    const arcLabelY = -h - gap * 1.0;
    const cm = gap * 0.5; // centre-mark half size

    const arcL = geometry.polyline[0];
    const arcR = geometry.polyline[geometry.polyline.length - 1];

    const angleDeg = `${((theta * 180) / Math.PI).toFixed(1)}°`;
    const radiusLabel = `R ${format(R)}`;

    // Angle arc (sampled to avoid SVG arc-flag ambiguity).
    let anglePts: Point2D[] = [];
    let angleLabelPos: Point2D | null = null;
    if (showAngle) {
      const rA = Math.min(S * 0.14, R * 0.5);
      const phiL = Math.atan2(arcL.y - C.y, arcL.x - C.x);
      const phiR = Math.atan2(arcR.y - C.y, arcR.x - C.x);
      anglePts = Array.from({ length: 25 }, (_, i) => {
        const s = phiL + (i / 24) * (phiR - phiL);
        return { x: C.x + rA * Math.cos(s), y: C.y + rA * Math.sin(s) };
      });
      angleLabelPos = { x: 0, y: C.y - (rA + textSize * 1.1) };
    }

    // R + angle labels — side by side on screen only.
    let radiusSpecPos: Point2D | null = null;
    let angleSpecPos: Point2D | null = null;
    if (!isPrint && showCenter && showAngle && angleLabelPos) {
      const pairGap = gap * 0.4;
      radiusSpecPos = { x: -pairGap, y: angleLabelPos.y };
      angleSpecPos = { x: pairGap, y: angleLabelPos.y };
    } else if (!isPrint && showCenter) {
      radiusSpecPos = { x: 0, y: C.y - textSize * 1.5 };
    }

    const radiusDir = Math.atan2(arcR.y - C.y, arcR.x - C.x);
    const perpOut = radiusDir + Math.PI / 2;
    const along = 0.68;
    const radiusLabelPos: Point2D = {
      x: C.x + along * (Rt.x - C.x) + Math.cos(perpOut) * gap * 1.9,
      y: C.y + along * (Rt.y - C.y) + Math.sin(perpOut) * gap * 1.9,
    };

    // Radius leader (centred above the crown) when the centre is off-figure.
    const crown = geometry.polyline[Math.round(geometry.polyline.length * 0.42)];
    const leaderKnee: Point2D = { x: crown.x, y: crown.y - gap * 1.9 };
    const leaderLabelPos: Point2D = { x: crown.x, y: leaderKnee.y - textSize * 0.6 };
    const leaderHalfW = textSize * 4.2; // generous half-width so the "R …" label never clips

    // Bounds — include every label so nothing clips at any scale.
    const xs = [...geometry.polyline.map((p) => p.x), L.x, Rt.x];
    const ys = [...geometry.polyline.map((p) => p.y), 0, A.y, chordDimY];
    const addLabel = (pos: Point2D, text: string, anchor: 'start' | 'middle' | 'end' = 'middle') => {
      const b = labelBounds(pos, text, textSize, anchor);
      xs.push(b.x0, b.x1);
      ys.push(b.y0, b.y1);
    };
    if (showCenter) {
      xs.push(C.x);
      ys.push(C.y + cm);
      if (isPrint) {
        addLabel(radiusLabelPos, radiusLabel);
        if (showAngle && angleLabelPos) {
          addLabel(angleLabelPos, angleDeg);
        }
      } else if (radiusSpecPos && angleSpecPos) {
        addLabel(radiusSpecPos, radiusLabel, 'end');
        addLabel(angleSpecPos, angleDeg, 'start');
      } else if (radiusSpecPos) {
        addLabel(radiusSpecPos, radiusLabel, 'middle');
      }
    } else {
      xs.push(leaderKnee.x - leaderHalfW, leaderKnee.x + leaderHalfW);
      ys.push(leaderLabelPos.y - textSize);
      addLabel(leaderLabelPos, `R ${format(R)}`, 'middle');
    }
    addLabel({ x: 0, y: arcLabelY }, `Arc ${format(params.arcLength)}`);
    addLabel({ x: 0, y: chordDimY - textSize * 0.5 }, format(c), 'middle');
    const m = textSize * 1.6 + gap * 0.4;
    const minX = Math.min(...xs) - m;
    const maxX = Math.max(...xs) + m;
    const minY = Math.min(...ys) - m;
    const maxY = Math.max(...ys) + m * 0.5;
    const viewBox = `${minX} ${minY} ${maxX - minX} ${maxY - minY}`;

    const clipTop = -(Math.max(h, depth) + gap * 4);
    const clipY = clipTop;
    const clipH = -clipTop;

    return {
      L, Rt, A, C, arcL, arcR, showCenter, showAngle, isPrint, gap, textSize, arrow, objW, thinW, chordDimY,
      arcLabelY, cm, anglePts, angleLabelPos, radiusSpecPos, angleSpecPos, angleDeg, radiusDir, radiusLabelPos,
      crown, leaderKnee, leaderLabelPos,
      viewBox, theta, clipY, clipH,
    };
  }, [geometry, params, format, isPrint]);

  const label = (
    pos: Point2D,
    text: string,
    anchor: 'start' | 'middle' | 'end',
    baseline: 'auto' | 'middle' = 'auto',
  ) => (
    <text
      x={pos.x}
      y={pos.y}
      className="dim-text"
      textAnchor={anchor}
      dominantBaseline={baseline}
      style={{ fontSize: d.textSize, strokeWidth: d.textSize * 0.18 }}
    >
      {text}
    </text>
  );

  return (
    <div className="card diagram-card">
      <svg
        className="diagram"
        viewBox={d.viewBox}
        role="img"
        aria-label="Dimensioned engineering drawing of the arch"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Construction geometry stays on/above the chord — never through A/G labels below. */}
          <clipPath id="diagram-above-chord">
            <rect x={d.L.x - d.gap} y={d.clipY} width={params.chord + d.gap * 2} height={d.clipH} />
          </clipPath>
        </defs>

        {/* chord centre line — solid span along the chord */}
        <line className="dl-center" x1={d.L.x} y1={0} x2={d.Rt.x} y2={0} strokeWidth={d.thinW} />

        {/* radius + angle construction (clipped above chord) */}
        {d.showCenter && (
          <g clipPath="url(#diagram-above-chord)">
            <line className="dl-thin" x1={d.C.x} y1={d.C.y} x2={d.arcL.x} y2={d.arcL.y} strokeWidth={d.thinW} />
            <line className="dl-thin" x1={d.C.x} y1={d.C.y} x2={d.arcR.x} y2={d.arcR.y} strokeWidth={d.thinW} />
            <polygon className="dl-arrow" points={arrowHead(d.arcR, d.radiusDir, d.arrow)} />
            <line className="dl-thin" x1={d.C.x - d.cm} y1={d.C.y} x2={d.C.x + d.cm} y2={d.C.y} strokeWidth={d.thinW} />
            <line className="dl-thin" x1={d.C.x} y1={d.C.y - d.cm} x2={d.C.x} y2={d.C.y + d.cm} strokeWidth={d.thinW} />
          </g>
        )}
        {d.isPrint ? (
          <>
            {d.showCenter && label(d.radiusLabelPos, `R ${format(params.radius)}`, 'middle', 'middle')}
            {d.showAngle && d.angleLabelPos && label(d.angleLabelPos, d.angleDeg, 'middle', 'middle')}
          </>
        ) : (
          <>
            {d.showCenter && d.radiusSpecPos && d.angleSpecPos && (
              <>
                {label(d.radiusSpecPos, `R ${format(params.radius)}`, 'end', 'middle')}
                {label(d.angleSpecPos, d.angleDeg, 'start', 'middle')}
              </>
            )}
            {d.showCenter && d.radiusSpecPos && !d.angleSpecPos && (
              label(d.radiusSpecPos, `R ${format(params.radius)}`, 'middle', 'middle')
            )}
          </>
        )}
        {d.showAngle && (
          <g clipPath="url(#diagram-above-chord)">
            <polyline className="dl-thin" points={toPts(d.anglePts)} fill="none" strokeWidth={d.thinW} />
          </g>
        )}

        {/* radius leader when the centre is off-figure */}
        {!d.showCenter && (
          <>
            <line className="dl-thin" x1={d.crown.x} y1={d.crown.y} x2={d.leaderKnee.x} y2={d.leaderKnee.y} strokeWidth={d.thinW} />
            <polygon
              className="dl-arrow"
              points={arrowHead(d.crown, Math.atan2(d.crown.y - d.leaderKnee.y, d.crown.x - d.leaderKnee.x), d.arrow)}
            />
            {label(d.leaderLabelPos, `R ${format(params.radius)}`, 'middle', 'auto')}
          </>
        )}

        {/* QC station drop-lines + labels */}
        {geometry.stations.map((st, i) => (
          <g key={i} className="dl-drop">
            <line x1={st.foot.x} y1={0} x2={st.head.x} y2={st.head.y} strokeWidth={d.thinW} />
            <circle cx={st.head.x} cy={st.head.y} r={d.thinW * 2.4} />
            <text
              x={st.foot.x}
              y={d.textSize * 1.05}
              className="dim-text dl-letter"
              textAnchor="middle"
              style={{ fontSize: d.textSize * 0.8, strokeWidth: d.textSize * 0.16 }}
            >
              {st.label}
            </text>
          </g>
        ))}

        {/* the bar (object line) */}
        <polyline className="dl-object" points={toPts(geometry.polyline)} fill="none" strokeWidth={d.objW} />

        {/* arc-length label */}
        {label({ x: 0, y: d.arcLabelY }, `Arc ${format(params.arcLength)}`, 'middle', 'middle')}

        {/* chord dimension above the figure */}
        <line className="dl-thin" x1={d.L.x} y1={-d.gap * 0.2} x2={d.L.x} y2={d.chordDimY - d.gap * 0.4} strokeWidth={d.thinW} />
        <line className="dl-thin" x1={d.Rt.x} y1={-d.gap * 0.2} x2={d.Rt.x} y2={d.chordDimY - d.gap * 0.4} strokeWidth={d.thinW} />
        <line className="dl-dim" x1={d.L.x} y1={d.chordDimY} x2={d.Rt.x} y2={d.chordDimY} strokeWidth={d.thinW} />
        <polygon className="dl-arrow" points={arrowHead({ x: d.L.x, y: d.chordDimY }, Math.PI, d.arrow)} />
        <polygon className="dl-arrow" points={arrowHead({ x: d.Rt.x, y: d.chordDimY }, 0, d.arrow)} />
        {label({ x: 0, y: d.chordDimY - d.textSize * 0.5 }, format(params.chord), 'middle', 'auto')}
      </svg>
      <div className="radius-box radius-box--left">
        <span className="radius-box__label">Inside radius</span>
        <span className="radius-box__value">{format(params.radius - barSize / 2)}</span>
      </div>
      <div className="radius-box radius-box--right">
        <span className="radius-box__label">Outside radius</span>
        <span className="radius-box__value">{format(params.radius + barSize / 2)}</span>
      </div>
    </div>
  );
}
