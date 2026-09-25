<p align="center">
  <img src="assets/icon-1024.png" width="128" alt="Coffee Cave icon">
</p>

<h1 align="center">Coffee Cave</h1>

<p align="center">A point of sale for coffee bars and restaurants. Take an order at the counter and it is on the kitchen screen at once.</p>

![A counter tablet with Flat White and Almond Croissant for Table 2, and the kitchen screen showing the same ticket under Prep with a Tree Nuts tag](assets/hero.png)

## Getting started

1. **Get your café set up.** Email [support@rainn.works](mailto:support@rainn.works). We create your café with you: its own address, your menu, currency and staff. Each person on staff gets a 3-digit staff code and a PIN.
2. **Open your café's address** on any tablet or laptop with a browser. Each screen can be a counter, a kitchen display or the manager's office.
3. **Log in.** Type your staff code, then your PIN. Managers and owners can log in with email and password, Google or GitHub instead.
4. **Take an order.** Tap a table, then **New Tab**, then **Add Items**. Tap **Flat White**, then **Confirm Order**.
5. **Open Kitchen on a second screen.** The Flat White is already there under **Prep**.

Coffee Cave runs in the browser, so there is nothing to install or update. Every screen gets the new version the next time it loads.

## Use

Staff do everything from the tables screen:

| Task | Where | What you can do |
|---|---|---|
| Seat a group | **New Table**, then **New Tab** | Several tabs per table, one per group |
| Order | **Add Items** | Search the menu, mark allergies, add a note, check the **Order Recap** |
| Cook | **Kitchen** | **Prep** shows what to make, **Serve** shows what is ready. Filter by category |
| Take payment | **Process Payment** | **Pay Remaining Balance**, **Pay Selected Items**, **Pay Custom Amount**, or **Split in** equal parts |
| Give change | **Change Calculator** | Works out change from the coins and notes your till holds |
| Close up | **Close Tab**, **Close Table** | Only when every item is paid |

Each café has its own settings. We set them up with you:

| Setting | Example |
|---|---|
| Menu, categories and prices | Flat White, Hot Drinks, €3.75 |
| Allergens on each item | Almond Croissant: Gluten, Milk, Eggs, Tree Nuts |
| Currency | EUR, shown in en-GB format |
| Coins and notes in the till | 1c to €500 |
| Colours | #6F4E37 and #D4B996 |
| Time zone | Europe/Paris |
| Staff and roles | Staff or admin, per café |

A role applies to one café only. Being staff at one café gives no access to another.

## How it works

![One order goes from the counter tablet to the Coffee Cave server, into Postgres, through Zero sync and onto the kitchen screen](assets/how-it-works.png)

Every screen keeps its own copy of the café's data, so a tap shows at once on the screen that made it. The order then goes to the Coffee Cave server, which checks the person's role and café and writes it to the database. [Zero](https://zero.rocicorp.dev) watches the database and sends the change to every other open screen, so the kitchen sees it without a refresh.

## Limits

- **Screens need an internet connection to take orders.** Each screen can show what it already has, but changes only save through the server.
- **Coffee Cave records payments. It does not take them.** Use your own card terminal and record the amount.

## Build from source

You need [Bun](https://bun.sh) and Docker.

```sh
bun install
```

Create `.dmno/.env.local` with these values. The secrets can be any string in development:

```sh
BACKEND_BASE_URL=http://localhost:3000
ZERO_CACHE_SERVER=http://localhost:4848
ZERO_UPSTREAM_DB=postgresql://user:password@127.0.0.1:5430/postgres
ZERO_REPLICA_FILE=/tmp/coffee-cave-replica.db
AUTH_PEPPER=dev
ACCESS_JWT_SECRET=dev
REFRESH_JWT_SECRET=dev
COOKIE_SECRET=dev
```

Start everything, then load the sample café in a second terminal:

```sh
bun run dev
bun run dev:seed
```

Open http://localhost:5173. Use the **Dev Mode** switcher in the corner: choose **Tenant** and type `coffee-cave`. Log in with staff code `001` and PIN `1234`. For the platform view, choose **Platform** and log in as `platform@coffeecave.com` with `platformAdmin123`.

Things that surprise a developer:

- `bun run dev` **deletes the local database** and the Zero replica each time it starts. Run `bun run dev:seed` again after each start.
- In production the café comes from the subdomain (`cafe-name.example.com`). On localhost it comes from the Dev Mode switcher, the `X-Dev-Tenant-Slug` header or `?tenant=`.
- After you change `drizzle/schema.ts`, run `bun run dev:db-generate:zero` to regenerate `src/zero/schema.gen.ts`, and `bun run dev:db-generate:migrations` for a migration.
- Config and secrets go through [dmno](https://dmno.dev). Every script runs under `dmno run`, and `.dmno/config.mts` lists every value and says which ones are required.
