# Smjernice za izradu web stranica (Web Dizajn Tvrtka)

Ova direktiva definira obaveznu strukturu i pravila boja prilikom dizajniranja ili strukturiranja web stranica za web dizajn tvrtku.

## Pravilo boja: 70-21-9/10 (Prilagođeno s 60-30-10)

Prilikom kreiranja dizajna, CSS-a ili Tailwind stilova strogo se pridržavajte sljedećeg omjera:

- **70% Primarna boja (Neutralna):** Koristi se za pozadinu i velike prazne prostore (npr. prljavo bijela ili vrlo tamno siva).
- **21% Sekundarna boja:** Koristi se za elemente poput izbornika (navigacije), kartica usluga i tekstualnih blokova.
- **9-10% Akcentna boja:** Koristi se za pozive na akciju (CTA gumbi), ključne ikone i naglaske koji trebaju privući pažnju korisnika.

## Proširene Usluge Dizajna

Prilikom listanja usluga tvrtke, uvijek uključi sljedeće stavke:
- **Web Dizajn (UI/UX):** Izrada prototipova, wireframeing i finalni dizajn sučelja fokusiran na korisničko iskustvo.
- **Grafički Dizajn:** Izrada logotipa, branding materijala, posjetnica i vizuala za društvene mreže.
- **Dizajn Digitalnih Proizvoda:** Dizajn mobilnih aplikacija i kompleksnih web sustava.
- **Redizajn Stranica:** Osvježavanje zastarjelih vizuala i poboljšanje funkcionalnosti postojećih web mjesta.

## Obavezna Struktura Stranice

Svaka glavna stranica (landing page) mora sadržavati sljedeće komponente u zadanom redoslijedu:

1. **Hero sekcija:** Snažna poruka s gumbom (CTA) "Započnimo projekt" koji mora biti u akcentnoj boji.
2. **Portfelj:** Prikaz radova s jasnim fokusom na vizualnu čistoću i preglednost.
3. **Detaljne usluge:** Razrada gore navedenih dizajnerskih usluga (korištenjem kartica i sekundarnih boja).
4. **Proces rada:** Objašnjenje koraka od početne ideje do realizacije projekta.
5. **Kontakt sekcija:** Jednostavna kontakt forma postavljena unutar kontejnera sekundarnih boja.

## Mikro-interakcije sa svrhom

Dizajn mora biti dinamičan i interaktivan, ali svaka interakcija mora imati jasnu svrhu (UX poboljšanje, a ne samo ukras):
- **Magnetski gumbi / Hover stanja:** CTA gumbovi na "hover" trebaju reagirati (npr. lift efekt ili glow) kako bi jasno sugerirali klikabilnost ("affordance").
- **Glatki ulazak na skrol (Fade & Slide):** Sadržaj se treba glatko učitavati pri skrolanju korištenjem Intersection Observera.
- **Vizualni feedback za kartice:** Prilikom prelaska mišem preko usluga ili portfelja, element se treba blago transformirati (npr. scale 1.02 ili tilt 3D efekt) kako bi ga izdvojio iz mase (kontrast za fokus).
