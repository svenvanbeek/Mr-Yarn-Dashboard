# Mr Yarn — Contributiemarge-dashboard

Live dashboard dat rechtstreeks uit Shopify, MyParcel en Shopify Payments
leest en per order de contributiemarge berekent — dezelfde logica als het
Google Sheets-script, maar dan als beveiligde web-app. Data wordt 1 uur
gecachet: elke keer dat je inlogt na dat uur, wordt er automatisch verse data
opgehaald. Geen cron-job nodig.

## 1. Naar GitHub zetten

1. Maak op [github.com](https://github.com) een nieuwe, **private** repository
   aan, bijvoorbeeld `mr-yarn-dashboard`.
2. Pak deze projectmap uit en push 'm naar die repository:
   ```bash
   cd mr-yarn-dashboard
   git init
   git add .
   git commit -m "Eerste versie dashboard"
   git branch -M main
   git remote add origin https://github.com/<jouw-gebruikersnaam>/mr-yarn-dashboard.git
   git push -u origin main
   ```
   (Geen `git` op je computer? Je kunt de map ook direct uploaden via de
   GitHub-website: "Add file" → "Upload files".)

## 2. Importeren in Vercel

1. Ga naar [vercel.com](https://vercel.com), log in met je GitHub-account.
2. Klik **Add New → Project**, kies je `mr-yarn-dashboard`-repository.
3. Laat de standaardinstellingen staan (Vercel herkent Next.js automatisch).
4. **Voordat je op Deploy klikt**: vul bij "Environment Variables" alle
   waarden uit `.env.example` in met je eigen gegevens (zie hieronder).
5. Klik **Deploy**. Na een minuut krijg je een eigen URL
   (iets als `mr-yarn-dashboard.vercel.app`).

## 3. Environment variables invullen

| Variabele | Waar te vinden |
|---|---|
| `SHOPIFY_SHOP` | Je winkel-domein, bijv. `mr-yarn.myshopify.com` |
| `SHOPIFY_CLIENT_ID` | Dev Dashboard → je app → App-instellingen |
| `SHOPIFY_CLIENT_SECRET` | Idem |
| `MYPARCEL_API_KEY` | MyParcel-account → Instellingen → Account → API |
| `DASHBOARD_PASSWORD` | Zelf verzinnen — dit typ je straks op de inlogpagina |
| `SESSION_SECRET` | Een lange, willekeurige string (bijv. via een password generator) — dit is NIET je wachtwoord, maar een aparte sleutel die alleen de server gebruikt |
| `COST_PACKAGING_PER_ORDER` | Gemiddelde verpakkingskosten per order, in euro's |
| `COST_FULFILLMENT_PER_ORDER` | Fulfilmentkosten per order, indien van toepassing |
| `COST_MARKETING_TOTAL` | Totale marketingkosten over de gekozen periode — wordt gelijk verdeeld over alle orders |
| `COST_OTHER_PER_ORDER` | Overige variabele kosten per order |
| `DEFAULT_PERIOD_DAYS` | Standaard periode in dagen, bijv. `30` |
| `EXCLUDED_CUSTOMER_NAMES` | Komma-gescheiden lijst met klantnamen die niet mogen meetellen, bijv. `Sven van Beek` |

Wijzig je een environment variable later? Dan moet je in Vercel opnieuw
deployen (Deployments → ⋯ → Redeploy) voordat de wijziging actief wordt.

## 4. Inloggen

Ga naar je Vercel-URL, vul het `DASHBOARD_PASSWORD` in dat je hebt ingesteld.
De site staat ook op `noindex` (robots.txt + meta-tag), dus zoekmachines
indexeren 'm niet.

## Hoe de data-verversing werkt

Er draait geen achtergrondproces. In plaats daarvan cachet elke API-call naar
Shopify/MyParcel voor 1 uur (`revalidate: 3600` in `lib/shopify.ts` en
`lib/myparcel.ts`). De eerste keer dat iemand het dashboard opent ná dat uur,
haalt de server verse data op; alle bezoeken daarna binnen dat uur gebruiken
de cache. Voor een dashboard dat je een paar keer per dag bekijkt, voelt dit
aan als "elk uur bijgewerkt" zonder dat er iets extra's hoeft te draaien of
te kosten.

## Nog open

- **Google Ads-koppeling**: marketingkosten worden nu nog handmatig ingevoerd
  via `COST_MARKETING_TOTAL` en gelijk verdeeld over alle orders. Zodra de
  Google Ads API-toegang is goedgekeurd, kan dit per campagne/kanaal.
- **Periodevergelijking**: er is nu een simpele periodekiezer (7/30/90 dagen),
  nog geen "vergelijk met vorig jaar"-functie.
- **Kostenparameters aanpassen**: gaat nu via environment variables in Vercel
  (vereist een redeploy). Dit kan later vervangen worden door een instellingen-
  scherm in het dashboard zelf, zodat een redeploy niet meer nodig is.
