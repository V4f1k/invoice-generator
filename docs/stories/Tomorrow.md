  > Pojdme se o tom jeste pobavit, jak by to dph mělo být a jak se to    │
│    bude realně v praxi využívat a jak se to využíva v praxi. Zatim nic  │
│    ne tvor ani nemen, zatim jen brainstorm                              │
╰──────────────────────────────────────────────────────────────────────────╯

✦ Samozřejmě, to je skvělý nápad. Zpomalíme a probereme to do hloubky. Je
  důležité, aby výsledné řešení bylo co nejlepší a odpovídalo realitě.
  Zapomeňme teď na úkoly a pojďme brainstormovat.

  Abychom naši diskuzi usměrnili, pojďme si projít několik typických
  scénářů z praxe:

  Scénář 1: Neplátce DPH
   * Jak jste správně řekl, neplátce DPH nemůže na faktuře uvádět DPH.
   * Pro něj by tedy mělo být vše, co se týká DPH, při tvorbě faktury
     úplně skryto.
   * Na faktuře musí mít uvedeno "Nejsem plátce DPH".
   * Toto je náš základní předpoklad, který jsme právě definovali v úkolu 
     1.7.1.

  Scénář 2: Běžný plátce DPH
   * Toto je nejčastější případ. Uživatel je plátce DPH.
   * Při tvorbě faktury potřebuje u každé položky flexibilně zvolit
     správnou sazbu DPH (např. 21 %, 15 %, 12 %, nebo 0 % pro osvobozená
     plnění).
   * Systém pak na konci faktury vše správně sečte a zobrazí rozpis DPH
     podle sazeb.
   * Toto je funkcionalita, kterou vývojář již implementoval ve Story 1.7.

  Scénář 3: Speciální režimy (např. "Reverse Charge")
   * V některých oborech (např. stavebnictví) existuje "režim přenesené
     daňové povinnosti".
   * V takovém případě plátce DPH vystaví fakturu, ale DPH se na ní
     nevyčísluje a je tam pouze text "daň odvede zákazník".
   * Je tento pokročilejší scénář pro naše uživatele v tuto chvíli
     důležitý?

  Který z těchto scénářů je pro vás a vaše uživatele nejdůležitější?
  Nebo existuje ještě jiný případ, na který bychom měli myslet? Pomůže
  nám to definovat, jak flexibilní musí náš systém být.

╭───────────────────────────────────────────────────────────────────╮
│  > Super potřebuji všechny scenáře aby fungovaly správně. Takže   │
│    vymysli zpusob a udpate story                                  │
╰───────────────────────────────────────────────────────────────────╯

✦ Rozumím. Zahrneme tedy všechny tři scénáře: Neplátce DPH, Běžný plátce
  DPH, a speciální režim "Přenesené daňové povinnosti" (Reverse Charge).
  To je velká, ale důležitá změna, která zajistí, že aplikace bude
  skutečně použitelná v praxi.

  Abychom v tom měli pořádek a zadání bylo pro vývojáře srozumitelné,
  navrhuji následující postup:

   1. Upravíme Story 1.7: Tuto story zaměříme pouze na základní logiku 
      Plátce / Neplátce DPH. Bude tedy obsahovat nastavení v profilu a
      logiku, která pro neplátce kompletně skryje možnost zadávat DPH na
      faktuře. Tím opravíme chybu, na kterou jste upozornil. Úkol 1.7.1,
      který jsem vytvořila na opravu, tím pádem smažeme a jeho obsah
      přesuneme sem.

   2. Vytvoříme novou Story 1.11: Vytvořím úplně novou story s názvem
      "Implementace režimu Přenesené daňové povinnosti (Reverse Charge)".
      Ta bude řešit speciální případ, kdy je na faktuře potřeba označit
      tento režim a přidat na PDF poznámku "daň odvede zákazník".

  Tímto rozdělíme práci na dvě logické, lépe zvládnutelné části.

  Souhlasíte s tímto rozdělením na dvě oddělené "stories"?

╭─────────╮
│  > Ano  │
╰─────────╯

✦ Výborně. Pustím se do toho.

  Nejdříve, soubor s opravou docs/stories/1.7.1.vat-fix.md již není
  potřeba, protože jeho logiku zapracuji přímo do Story 1.7. Můžete ho
  prosím smazat, abychom v tom měli pořádek.

  Nyní upravím Story 1.7, aby přesně řešila pouze základní nastavení
  Plátce / Neplátce DPH a skrývání DPH funkcí pro neplátce. Znovu si
  načtu její aktuální obsah.
 ╭───────────────────────────────────────────────────────╮
 │ ✔ ReadFile ...docs/stories/1.7.vat-functionality.md  │
 ╰───────────────────────────────────────────────────────╯
✦ Rozumím. Upravím tedy Story 1.7 tak, aby obsahovala novou logiku pro
  neplátce DPH.

  Nejdříve přidám nové akceptační kritérium, které zajistí, že se DPH
  pro neplátce na faktuře vůbec nezobrazí.
 ╭──────────────────────────────────────────────────────────────────────────╮
 │ ✔ Edit ...docs/stories/1.7.vat-functionality.md: 6. Celkové součty na … │
 │                                                                          │
 │    16   4. Pokud je políčko "Nejsem plátce DPH" odškrtnuto,              │
 │         pole pro DIČ je aktivní.                                         │
 │    17   5. Formulář pro tvorbu faktury umožňuje u každé                  │
 │         položky volitelně zadat sazbu DPH (např. výběrem z               │
 │         21 %, 15 %, 12 %, 0 %).                                          │
 │    18   6. Celkové součty na faktuře (mezisoučet, celkové                │
 │         DPH, celková částka) jsou správně vypočítány.                    │
 │    19 + 7. Pokud je dodavatel označen jako "Neplátce DPH",               │
 │       je celá funkcionalita pro zadávání DPH na faktuře                  │
 │       (výběr sazby, výpis DPH v součtu) skryta.                          │
 │    20                                                                    │
 │    21   ## Úkoly / Podúkoly                                              │
 │    22   - [x] **Úkol 1: Aktualizace databáze a UI pro status             │
 │         plátce DPH (AC: #1, #2, #3, #4)**                                │
 ╰──────────────────────────────────────────────────────────────────────────╯
✦ Kritérium bylo přidáno. Nyní přidám odpovídající úkol pro vývojáře a
  změním status story, aby bylo jasné, že je na ní potřeba znovu pracovat.
 ╭──────────────────────────────────────────────────────────────────────────╮
 │ ✔ Edit ...docs/stories/1.7.vat-functionality.md: - [x] **Úkol 2: Imple… │
 │                                                                          │
 │    23     - [x] Podúkol 1.1: Aktualizovat tabulku                        │
 │         `suppliers` o boolean sloupec (např.                             │
 │         `is_non_vat_payer`).                                             │
 │    24     - [x] Podúkol 1.2: V UI na stránce `/settings`                 │
 │         přidat zaškrtávací políčko "Nejsem plátce DPH".                  │
 │    25     - [x] Podúkol 1.3: Implementovat v UI logiku,                  │
 │         která na základě zaškrtnutí políčka znepřístupní                 │
 │         pole pro DIČ.                                                    │
 │    26 - - [x] **Úkol 2: Implementace logiky DPH ve fakturách             │
 │       (AC: #4, #5, #6)**                                                 │
 │    26 + - [ ] **Úkol 2: Implementace logiky DPH ve fakturách             │
 │       (AC: #4, #5, #6, #7)**                                             │
 │    27     - [x] Podúkol 2.1: Aktualizovat tabulku                        │
 │         `invoice_items` o sloupec pro sazbu DPH (např.                   │
 │         `vat_rate`).                                                     │
 │    28     - [x] Podúkol 2.2: Upravit formulář pro tvorbu                 │
 │         faktury tak, aby bylo možné u každé položky zadat                │
 │         sazbu DPH.                                                       │
 │    29     - [x] Podúkol 2.3: Upravit logiku výpočtů na                   │
 │         frontendu i backendu tak, aby správně počítala DPH a             │
 │         celkové částky.                                                  │
 │    30 +   - [ ] Podúkol 2.4: Implementovat v UI fakturačního             │
 │       formuláře logiku, která skryje veškeré pole pro                    │
 │       zadávání DPH, pokud je dodavatel neplátce.                         │
 │    31   - [x] **Úkol 3: Aktualizace PDF generování (AC:                  │
 │         #3)**                                                            │
 │    32     - [x] Podúkol 3.1: Upravit PDF šablonu a logiku                │
 │         generování tak, aby zobrazovala text "Nejsem plátce              │
 │         DPH", pokud je to relevantní.                                    │
 │    33     - [x] Podúkol 3.2: Zajistit, aby se na PDF faktuře             │
 │         správně zobrazovaly částky s DPH i bez DPH.                      │
 ╰──────────────────────────────────────────────────────────────────────────╯
✦ Úkoly jsou upraveny. Nyní změním status celé story na "InProgress", aby
  bylo zřejmé, že vyžaduje další práci.
 ╭──────────────────────────────────────────────────────────────────────────╮
 │ ✔ Edit ...docs/stories/1.7.vat-functionality.md: ## Status => ## Status │
 │                                                                          │
 │    1   # Story 1.7: Implementace funkcionality DPH                       │
 │    2                                                                     │
 │    3   ## Status                                                         │
 │    4 - - Approved                                                        │
 │    4 + - InProgress                                                      │
 │    5                                                                     │
 │    6                                                                     │
 │    7   ## Story                                                          │
 ╰──────────────────────────────────────────────────────────────────────────╯

ℹ⚡ You have reached your daily gemini-2.5-pro quota limit.
  ⚡ Automatically switching from gemini-2.5-pro to gemini-2.5-flash for 
  the remainder of this session.
  ⚡ To increase your limits, upgrade to a Gemini Code Assist Standard or 
  Enterprise plan with higher limits at 
  https://goo.gle/set-up-gemini-code-assist
  ⚡ Or you can utilize a Gemini API Key. See: 
  https://goo.gle/gemini-cli-docs-auth#gemini-api-key
  ⚡ You can switch authentication methods by typing /auth
✕ [API Error: Please submit a new query to continue with the Flash model.]



#### This is for context of what you need to do tommorrow. 