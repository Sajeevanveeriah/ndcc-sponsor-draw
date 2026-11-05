# NDCC Player Sponsor Drink Card Draw

Spin-the-wheel draw for the weekly player sponsor drink card at Newcomb & District Cricket Club.

Live site: https://sajeevanveeriah.github.io/ndcc-sponsor-draw/

## Running the draw

1. Pick the round and date, then press **SPIN**.
2. **Confirm winner** to record it, or **Re-draw** to spin again.
3. A confirmed winner is kept on that device until it is saved. Press **Copy and open GitHub**, select everything in `winners.json`, paste, and commit. The site updates within a few minutes.

By default, sponsors who have already won this season are left out of the wheel. Untick the option to put them back in, or untick single entries to leave them out for a week.

## Updating sponsors

Edit `data/sponsors.json`. Each entry is one sponsor and the player they back:

```json
{ "sponsor": "Phoenix Truck Bodies", "player": "Skye Green", "logo": "logos/phoenix.webp" }
```

Add new logo files to `logos/`. Sponsor details and logos come from https://www.ndcc.com.au/player-sponsors.

## Hosting

GitHub Pages, deployed from the `main` branch root. There is no build step.

## Project handoff

Read the [project handoff](HANDOFF.md) for current work, checks and the next step.
