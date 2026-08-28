# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

---

# Elefin — Regeln für die Entwicklung

## Kontext
Native App (Expo SDK 57 / React Native, TypeScript strikt) für Vorsorge- und
Nachlassdaten. Zero-Knowledge: Wir können die Daten unserer Nutzer nicht lesen.
Märkte: Österreich und Deutschland. Android zuerst, iOS folgt.

Der Auftraggeber ist kein Entwickler.

## Ordnerstruktur
Der Import-Alias `@/` zeigt auf `src/`. Also `@/crypto/...`, nicht `../../crypto/...`.

## Unverhandelbare Regeln
1. Kryptografie ausschließlich in `src/crypto/`. Kein anderer Ordner ruft
   Verschlüsselungsfunktionen auf.
2. Supabase-Zugriff ausschließlich in `src/data/`. Screens kennen keine
   Datenbank. Screens sehen nur Klartext, das Repository nur Chiffrat.
3. Kein Text im Code. Alle Texte über i18n-Schlüssel, Muster
   `bereich.screen.element`. Auch Fehlermeldungen und Knopfbeschriftungen.
4. Keine harten Farb-, Abstands- oder Schriftwerte. Nur Tokens aus `src/design/`.
5. Niemals Nutzerinhalte protokollieren — nicht in Logs, nicht in
   Absturzberichten, nicht in Fehlermeldungen. Nur Fehlercodes.
6. Keine Zugangsdaten oder Passwörter von Nutzern speichern, weder lokal noch
   auf dem Server. Wir speichern Hinweise, wo etwas liegt.
7. Jeder verschlüsselte Datensatz enthält im Klartext-Inhalt ein Feld
   `schemaVersion`. Ohne dieses Feld ist jede spätere Strukturänderung
   Datenverlust — Migrationen laufen auf dem Gerät.
8. Schema-Änderungen nur als nummerierte Migrationsdatei unter
   `supabase/migrations/`. Nie per Klick im Supabase-Dashboard.
9. Row Level Security auf jeder Tabelle, ab der ersten Migration.
10. Kategorien und Feldnamen bekommen stabile technische IDs, die nie geändert
    werden (`bank_accounts`, nicht `Bankverbindungen`). Anzeigenamen kommen aus
    den Sprachdateien.
11. Keine Fachlogik in Screens. Screens rendern und rufen Hooks auf.

## Sprache und Markt sind zwei getrennte Achsen
Sprache = was jemand liest (`src/i18n/`). Markt = welches Recht gilt
(`src/content/`). Eine türkischsprachige Familie in Wien braucht türkische
Oberfläche und österreichische Rechtsinhalte. Marktinhalte bringen ihre eigenen
Textschlüssel mit; es gibt keine zwei deutschen Sprachdateien.

## Arbeitsweise
- Vor größeren Änderungen erst den Plan zeigen, dann auf Bestätigung warten.
- In kleinen Schritten arbeiten, nach jedem lauffähigen Stand anhalten.
- Code kommentieren. Der Auftraggeber will jede Zeile verstehen.
- Bei Unsicherheit nachfragen statt raten.
- Keine neuen Abhängigkeiten ohne Rückfrage.
- Deutsch antworten.

## Testen
Automatisierte Tests nur für `src/crypto/` und `src/domain/`. Alles andere
manuell nach den Testschritten der Screen-Spezifikation. Ausdrücklich nicht:
Snapshot-Tests, Komponententests der Oberfläche, Abdeckungsquoten.

## Definition of Done
Siehe `docs/DEFINITION-OF-DONE.md`. Ein Screen ist erst fertig, wenn alle
Punkte dort erfüllt sind.