/**
 * Die Zeichnungen — vorerst Platzhalter von der Entwicklung.
 *
 * Alle nach denselben Leitplanken: nur Linien, nur Gegenstände, eine Farbe,
 * keine Flächen, keine Menschen als Figuren, keine Schlösser oder Schilde.
 * Sie zeigen Größe und Gewicht, nicht den endgültigen Strich.
 *
 * Wenn die echten Zeichnungen kommen, wird NUR diese Datei ersetzt. Kein
 * Screen wird dafür angefasst.
 */
import type { ReactNode } from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type DrawingProps = {
  /** Breite in Punkt. Die Höhe ergibt sich aus dem Seitenverhältnis. */
  size: number;
  color: string;
};

/** Gemeinsamer Rahmen: einheitliche Strichstärke und runde Enden. */
function Canvas({
  size,
  color,
  viewBox,
  ratio,
  children,
}: DrawingProps & { viewBox: string; ratio: number; children: ReactNode }) {
  return (
    <Svg
      width={size}
      height={Math.round(size * ratio)}
      viewBox={viewBox}
      fill="none"
      stroke={color}
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </Svg>
  );
}

// --- Symbole für die Blöcke ------------------------------------------------

export function Dose(p: DrawingProps) {
  return (
    <Canvas {...p} viewBox="0 0 24 24" ratio={1}>
      <Rect x={4} y={8} width={16} height={12} rx={2} />
      <Path d="M4 11h16" />
      <Path d="M9 8V5h6v3" />
    </Canvas>
  );
}

export function Haus(p: DrawingProps) {
  return (
    <Canvas {...p} viewBox="0 0 24 24" ratio={1}>
      <Path d="M4 11l8-6 8 6" />
      <Path d="M6 10v10h12V10" />
      <Path d="M10 20v-6h4v6" />
    </Canvas>
  );
}

export function Napf(p: DrawingProps) {
  return (
    <Canvas {...p} viewBox="0 0 24 24" ratio={1}>
      <Path d="M4 12h16a8 8 0 0 1-8 8 8 8 0 0 1-8-8Z" />
      <Path d="M8 9c0-1.5 1.8-2.5 4-2.5s4 1 4 2.5" />
    </Canvas>
  );
}

export function Ordner(p: DrawingProps) {
  return (
    <Canvas {...p} viewBox="0 0 24 24" ratio={1}>
      <Path d="M4 6h6l2 2h8v11H4Z" />
      <Path d="M4 11h16" />
    </Canvas>
  );
}

export function Briefkasten(p: DrawingProps) {
  return (
    <Canvas {...p} viewBox="0 0 24 24" ratio={1}>
      <Path d="M4 10a4 4 0 0 1 8 0v9H4Z" />
      <Path d="M12 10h6a2 2 0 0 1 2 2v7h-8" />
      <Path d="M7 13h2" />
    </Canvas>
  );
}

export function Fueller(p: DrawingProps) {
  return (
    <Canvas {...p} viewBox="0 0 24 24" ratio={1}>
      <Path d="M5 19l3-1 10-10-2-2L6 16Z" />
      <Path d="M14 6l4 4" />
      <Path d="M5 19l1-3" />
    </Canvas>
  );
}

export function Zettel(p: DrawingProps) {
  return (
    <Canvas {...p} viewBox="0 0 24 24" ratio={1}>
      <Path d="M6 4h9l3 3v13H6Z" />
      <Path d="M15 4v3h3" />
      <Path d="M9 12h6" />
      <Path d="M9 16h4" />
    </Canvas>
  );
}

// --- Symbole für die Vorteile des Schließfachs -----------------------------

/** Zwei Köpfe, angedeutet — die Familie. */
export function Menschen(p: DrawingProps) {
  return (
    <Canvas {...p} viewBox="0 0 24 24" ratio={1}>
      <Circle cx={8} cy={8} r={3} />
      <Circle cx={16} cy={9} r={2.5} />
      <Path d="M3 20c0-3 2.5-5 5-5s5 2 5 5" />
      <Path d="M13 20c0-2.5 1.5-4 3-4s3 1.5 3 4" />
    </Canvas>
  );
}

/** Eine Wolke — online verwahrt. */
export function Wolke(p: DrawingProps) {
  return (
    <Canvas {...p} viewBox="0 0 24 24" ratio={1}>
      <Path d="M7 18h10a4 4 0 0 0 .5-7.97A6 6 0 0 0 6.1 11 3.5 3.5 0 0 0 7 18Z" />
    </Canvas>
  );
}

/** Eine Uhr mit Rückwärtspfeil — frühere Stände bleiben erhalten. */
export function Verlauf(p: DrawingProps) {
  return (
    <Canvas {...p} viewBox="0 0 24 24" ratio={1}>
      <Path d="M4 12a8 8 0 1 0 2.3-5.6" />
      <Path d="M4 4v4h4" />
      <Path d="M12 8v4l3 2" />
    </Canvas>
  );
}

// --- Größere Zeichnungen für die Schwellen ---------------------------------

/** Offene Schublade mit Schlüssel und Brief. Für den Startscreen. */
export function Schublade(p: DrawingProps) {
  return (
    <Canvas {...p} viewBox="0 0 160 120" ratio={0.75}>
      <Path d="M18 46h124v52a6 6 0 0 1-6 6H24a6 6 0 0 1-6-6Z" />
      <Path d="M18 62h124" />
      <Path d="M70 74h20" />
      <Path d="M44 46V26a6 6 0 0 1 6-6h60a6 6 0 0 1 6 6v20" />
      <Path d="M58 46V34h44v12" />
      <Circle cx={66} cy={30} r={5} />
      <Path d="M66 35v7" />
      <Path d="M66 38h4" />
      <Path d="M84 26h20v12H84Z" />
      <Path d="M84 26l10 7 10-7" />
    </Canvas>
  );
}

/** Schließfach mit zwei Schlüsseln. Für die Grundsätze und den Abschluss. */
export function Schliessfach(p: DrawingProps) {
  return (
    <Canvas {...p} viewBox="0 0 160 110" ratio={0.69}>
      <Rect x={14} y={14} width={88} height={82} rx={4} />
      <Path d="M14 36h88" />
      <Circle cx={60} cy={66} r={9} />
      <Path d="M60 75v8" />
      <Path d="M118 34a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z" />
      <Path d="M118 34v30" />
      <Path d="M118 46h7" />
      <Path d="M118 56h5" />
      <Path d="M140 52a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z" />
      <Path d="M140 52v30" />
      <Path d="M140 64h7" />
      <Path d="M140 74h5" />
    </Canvas>
  );
}

/** Zettel mit Haken. Für die Übersicht und den Todesfall-Weg. */
export function Checkliste(p: DrawingProps) {
  return (
    <Canvas {...p} viewBox="0 0 140 126" ratio={0.9}>
      <Path d="M34 16h56l18 18v76H34Z" />
      <Path d="M90 16v18h18" />
      <Path d="M48 58l8 8 16-16" />
      <Path d="M80 62h20" />
      <Path d="M48 88l8 8 16-16" />
      <Path d="M80 92h20" />
    </Canvas>
  );
}