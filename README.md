# MietSort

MietSort hilft privaten Vermietern und kleinen Hausverwaltungen, Mietanfragen strukturiert zu sichten und nachvollziehbar zu bearbeiten. Die endgültige Entscheidung trifft der Vermieter.

## Aktueller Stand

Frontend-Prototyp aus HTML, CSS und JavaScript, ohne Framework oder Build-Schritt. Enthalten sind ein Dashboard, eine Beispielwohnung, sechs Beispielbewerbungen, Suche, Filter, Sortierung, Detailansicht, Vormerkungen, Prüfstatus und ein Bewerbungsformular. Die Darstellung passt sich an Desktop und Smartphone an.

**Die Demo speichert Bewerbungen ausschließlich im lokalen Browser (`localStorage`).** Es gibt noch keine Benutzerkonten, zentrale Datenbank oder Zugriffstrennung. Der Bewerbungslink öffnet die Formularansicht derselben Demo; er übermittelt noch keine Bewerbungen zwischen Geräten oder Personen. Bitte nur mit Testdaten verwenden.

## Lokal starten

Voraussetzung: Python 3. Im Projektordner ausführen:

```sh
python3 -m http.server 8000 --bind 127.0.0.1 --directory dist
```

Anschließend http://localhost:8000 öffnen. Die Formularansicht ist unter http://localhost:8000/#bewerben erreichbar. Der Server lässt sich mit Strg+C beenden.

Schriften werden von Google Fonts und Wohnungsbilder von Unsplash geladen; diese benötigen eine Internetverbindung.

## Projektstruktur

- `dist/index.html`: Seitenstruktur und Formular
- `dist/app.css`: Gestaltung und responsive Ansichten
- `dist/app.js`: Beispieldaten, Darstellung, Filter und Browserspeicherung
- `VISION.txt`: Produktvision, Stand 22.11.2026
- `.openai/hosting.json`: vorhandene Konfiguration für statisches Hosting

`dist/` enthält aktuell den direkt gepflegten Code und wird deshalb mit Git versioniert.

## Nächster Entwicklungsschritt

Die erste Version soll einen vollständigen Ablauf über einen eigenständigen Bewerbungslink ermöglichen:

1. Vermieter meldet sich an und legt eine Wohnung an.
2. Interessenten senden ihre Angaben über den öffentlichen Link.
3. Bewerbungen werden zentral gespeichert und erscheinen nur beim zugehörigen Vermieter.
4. Der Vermieter prüft, merkt vor und verwaltet den Bearbeitungsstatus.
5. Nicht mehr benötigte Bewerbungen können gelöscht werden.

Hierfür fehlen insbesondere Anmeldung, Datenbank, serverseitige Validierung und Zugriffskontrollen. Vormerkung und Prüfstatus sollen getrennt gespeichert werden. E-Mail-Versand und Besichtigungseinladungen folgen später. Eine Kleinanzeigen-Anbindung ist eine spätere Erweiterung und derzeit nicht implementiert.

## Bekannte Grenzen

Wohnung, Prüfkriterien und einige Datumsanzeigen sind fest hinterlegt. Die Vollständigkeit wird derzeit allein anhand einer Einkommensangabe bestimmt. Antwortvorbereitung, Objektwechsel, Profil und Benachrichtigungen sind Platzhalter. Automatisierte Tests und ein Build-System sind noch nicht vorhanden.
