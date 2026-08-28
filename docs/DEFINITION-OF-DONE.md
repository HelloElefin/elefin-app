# Definition of Done — je Screen

Ein Screen gilt als fertig, wenn **alle** Punkte erfüllt sind:

- [ ] Läuft auf Android-Gerät und im Browser
- [ ] Alle vier Zustände umgesetzt: Laden, leer, Fehler, Inhalt
- [ ] Kein Text im Code — alles aus `src/i18n`
- [ ] Keine harten Farb- oder Abstandswerte — alles aus `src/design`
- [ ] Fehlerfall zeigt einen Fehlercode an (Format `E-4A7C`)
- [ ] Funktioniert bei 200 % Schriftgröße ohne abgeschnittenen Text
- [ ] Bedienelemente mindestens 44 Punkt hoch
- [ ] Keine Fachlogik im Screen
- [ ] Manuelle Testschritte aus der Screen-Spezifikation durchlaufen
- [ ] Commit gemacht

Der Zustand „leer" ist besonders wichtig — die App ist am Anfang immer leer,
und genau dort entscheidet sich, ob jemand anfängt.