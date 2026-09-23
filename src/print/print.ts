/**
 * Das fertige Blatt zum Drucken öffnen.
 *
 * Im Browser über einen unsichtbaren Rahmen: Der Druckdialog bekommt dann
 * genau die erzeugte Seite und nicht die App drumherum. Ein neues Fenster
 * wäre der andere Weg, wird aber von Pop-up-Blockern gern verschluckt.
 *
 * Auf dem Handy passiert vorerst nichts — dort kommt in Phase 2 ein echtes
 * PDF über expo-print.
 */
import { Platform } from 'react-native';

export function canPrint(): boolean {
  return Platform.OS === 'web' && typeof document !== 'undefined';
}

export function printHtml(html: string): void {
  if (!canPrint()) return;

  const rahmen = document.createElement('iframe');
  rahmen.setAttribute('aria-hidden', 'true');
  rahmen.style.position = 'fixed';
  rahmen.style.right = '0';
  rahmen.style.bottom = '0';
  rahmen.style.width = '0';
  rahmen.style.height = '0';
  rahmen.style.border = '0';

  rahmen.onload = () => {
    const fenster = rahmen.contentWindow;
    if (!fenster) return;
    fenster.focus();
    fenster.print();
    // Erst aufräumen, wenn der Dialog sicher offen war. Safari braucht das.
    setTimeout(() => rahmen.remove(), 1000);
  };

  document.body.appendChild(rahmen);
  rahmen.srcdoc = html;
}