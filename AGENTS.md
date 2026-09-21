# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

---

# Elefin — Regeln für die Entwicklung

## Kontext
App (Expo SDK 57 / React Native, TypeScript strikt) für Vorsorge- und
Nachlassdaten. Zero-Knowledge: Wir können die Daten unserer Nutzer nicht lesen.
Märkte: Österreich und Deutschland.

Zielplattformen: Android, iOS und Web — aus einer Codebasis. Android nativ
zuerst. iOS vorerst über die Webfassung, bis das Apple-Entwicklerkonto da ist.
Web bleibt danach als dritte Plattform bestehen.

Der Auftraggeber ist kein Entwickler.

## Phasen
Die Entwicklung läuft in drei Phasen. Vor jeder Aufgabe klären, zu welcher sie
gehört.

**Phase 1 — Testfassung.** Der lokale Flow im Browser, am Handy benutzbar, für
Gespräche mit Testnutzern. Folgende Abweichungen sind **bewusst** und gelten
nur für Web-Plattformdateien (`*.web.ts`, `*.web.tsx`):
- Ablage über `sessionStorage`, im Klartext, nach der Sitzung weg
- Keine Verschlüsselung
- PDF nur als Druckansicht des Browsers
- Ein Testbanner oben auf jedem Screen

Diese Abweichungen nicht „reparieren". Die native Fassung bleibt davon
unberührt und verschlüsselt.

**Phase 2 — lokaler Flow fertig.** Nativ, verschlüsselt, Wiedereinstieg.
Web zieht nach: IndexedDB, Verschlüsselung über WebCrypto, echtes PDF.
Testbanner entfällt.

**Phase 3 — nach der Paywall.** Konto, Umzug, Freigaben, Ernstfall.

Faustregel: Alles, was Daten ist (Katalog, Kategorie-IDs, Textschlüssel,
Flusslogik), überlebt alle drei Phasen. Alles, was das Gerät berührt
(Ablage, Verschlüsselung, PDF), wird je Phase ersetzt.

## Ordnerstruktur
Der Import-Alias `@/` zeigt auf `src/`. Also `@/crypto/...`, nicht `../../crypto/...`.

```
src/catalog/   Fragenkatalog — Struktur und Textschlüssel, keine Texte
src/crypto/    Kryptografie
src/data/      Ablage (lokal, Server)
src/domain/    Fachlogik: Kategorien, Akte, Fluss, Zustände
src/content/   Marktinhalte (AT/DE)
src/i18n/      Sprachdateien
src/design/    Tokens
src/ui/        Bausteine
src/app/       Screens (expo-router)
```

## Unverhandelbare Regeln
1. Kryptografische Verfahren ausschließlich in `src/crypto/`. Andere Bereiche
   rufen die Fassade `@/crypto` auf, implementieren aber nichts selbst.
2. Supabase-Zugriff ausschließlich in `src/data/`. Screens kennen keine
   Datenbank. Screens sehen nur Klartext, das Repository nur Chiffrat
   (Ausnahme Phase 1 Web, siehe oben).
3. Kein Text im Code. Alle Texte über i18n-Schlüssel, auch Fehlermeldungen und
   Knopfbeschriftungen. Schlüssel sind englisch, sprechend und stabil:
   `flow.<screen>.title`, `question.<category>.<field>.label`,
   `option.<category>.<field>..<value>.label`, `common.<element>`. Ein Schlüssel wird
   nie umbenannt, auch wenn sich der Text komplett ändert. Ein Schlüssel je
   Textstelle, auch bei gleichem Wortlaut.
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
10. Kategorien, Screens und Feldnamen bekommen stabile technische IDs, die nie
    geändert werden (`bank_accounts`, nicht `Bankverbindungen`). IDs sind
    sprechend, nie positionsbasiert (`bank-account`, nicht `S-C-09`).
    Anzeigenamen kommen aus den Sprachdateien.
11. Keine Fachlogik in Screens. Screens rendern und rufen Hooks auf.
12. Der Krypto-Bereich wird ausschließlich über `@/crypto` angesprochen.
    Niemals direkt aus `@/crypto/keys`, `@/crypto/envelope` usw.
    importieren. Ausnahme: Tests innerhalb von `src/crypto`.
13. Datei- und Bezeichnernamen englisch. Kommentare, Commit-Nachrichten und
    Antworten deutsch. Ausnahme: Datenbankspalten und gespeicherte Felder
    behalten ihre bestehenden Namen (`inhalt_chiffre` usw.) — umbenennen wäre
    eine Migration.
14. Fragen entstehen im Katalog (`src/catalog/catalog.json`), nicht in Screens.
    Der generische Frage-Screen stellt jeden Katalogeintrag dar. Eigene Screens
    gibt es nur für die Rahmenscreens: Start, Grundsätze, Situation, Inventar,
    Übersicht, Abschluss.
15. Plattformunterschiede ausschließlich über Plattformdateien
    (`name.web.ts` neben `name.ts`). Bestehende Dateien werden dafür nicht
    umgebaut.

## Sprache und Markt sind zwei getrennte Achsen
Sprache = was jemand liest (`src/i18n/`). Markt = welches Recht gilt
(`src/content/`). Eine türkischsprachige Familie in Wien braucht türkische
Oberfläche und österreichische Rechtsinhalte. Marktinhalte bringen ihre eigenen
Textschlüssel mit; es gibt keine zwei deutschen Sprachdateien.

## Sicherheitsmodell (entschieden, nicht neu verhandeln)

**Generalschlüssel:** Zufällig erzeugt, NICHT aus dem Passwort abgeleitet.
Er wird mehrfach verpackt — mit dem Passwort, mit dem ausgedruckten
Sicherheitsschlüssel, mit dem Gerät, und doppelt verschlossen für den
Ernstfall. Ein Passwortwechsel ersetzt nur eine Verpackung; es wird nie
etwas neu verschlüsselt.

**Freigaben:** Pro Eintrag ein eigener zufälliger Datenschlüssel. Der wird
pro berechtigter Person in einen Umschlag verpackt. Daraus folgt:
abgestufte Freigaben sind möglich, Vollzugriff bedeutet einen Umschlag je
Eintrag, und ein Entzug löscht die Umschlagzeilen wirklich — Ausblenden im
Frontend genügt nicht.

**Ernstfall:** Der Generalschlüssel liegt zusätzlich in einer doppelt
verschlossenen Kiste — ein Anteil beim Server, einer bei der benannten
Person. Getrennt ist beides wertlos. Freigabe nur nach geprüfter
Sterbeurkunde, ohne Wartefrist.

**Passwort vergessen:** Nur über den ausgedruckten Sicherheitsschlüssel oder
ein angemeldetes Gerät. Kein Partner-Rückweg zu Lebzeiten, keine
Wartefristen, kein Zurücksetzen per E-Mail — der Server kann das Passwort
nicht ersetzen, weil er den Generalschlüssel nicht hat.

**Verfahren:** scrypt (N=2^17, r=8, p=1) für die Ableitung aus dem Passwort,
nativ über react-native-quick-crypto. XChaCha20-Poly1305, X25519 und HKDF
über @noble. Kein Argon2id — in JavaScript braucht es auf einem aktuellen
Gerät über 60 Sekunden.

**Gerätebindung ist Bequemlichkeit, kein Fundament.** Ein Gerät verwahrt nur
eine Verpackung des Generalschlüssels, niemals einen Zugang, der ohne
Passwort oder Sicherheitsschlüssel funktioniert. Sonst ist die Webversion
nicht baubar.

## Arbeitsweise
- Vor größeren Änderungen erst den Plan zeigen, dann auf Bestätigung warten.
- In kleinen Schritten arbeiten, nach jedem lauffähigen Stand anhalten.
- Code kommentieren. Der Auftraggeber will jede Zeile verstehen.
- Bei Unsicherheit nachfragen statt raten.
- Keine neuen Abhängigkeiten ohne Rückfrage.
- Deutsch antworten.

## Testen
Automatisierte Tests mit Vitest (`npm test`) für `src/crypto/`, `src/domain/`,
`src/catalog/` und `src/data/`. Sie laufen auf dem PC, nicht auf dem Gerät.
Ausgenommen ist `src/crypto/derivation.ts`, die als einzige Datei einen
nativen Aufruf macht. `src/data/` wird gegen die Ablage-Schnittstelle getestet,
nicht gegen SQLite oder Supabase.

Jede Änderung am Katalog muss die Katalogprüfungen bestehen (IDs, Textschlüssel
in allen Sprachdateien, Erreichbarkeit jedes Screens).

Alles andere manuell nach den Testschritten der Screen-Spezifikation.
Ausdrücklich nicht: Snapshot-Tests, Komponententests der Oberfläche,
Abdeckungsquoten.

## Definition of Done
Siehe `docs/DEFINITION-OF-DONE.md`. Ein Screen ist erst fertig, wenn alle
Punkte dort erfüllt sind.