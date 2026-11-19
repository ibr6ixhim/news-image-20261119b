# 19 November 2026 — The Day in One Page

[![make.fun · news-image-20261119](https://make.fun/badge/news-image-20261119.svg)](https://make.fun/bounty/news-image-20261119?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261119)
[![rank](https://make.fun/badge/news-image-20261119/ibr6ixhim/news-image-20261119b/rank.svg)](https://make.fun/bounty/news-image-20261119/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261119)
[![reward](https://make.fun/badge/news-image-20261119/ibr6ixhim/news-image-20261119b/reward.svg)](https://make.fun/bounty/news-image-20261119?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261119)

A photographic front page for the [make.fun bounty](https://make.fun/bounty/news-image-20261119):
the Gulf war widens as Iran hits a US base in Kuwait, the Kerch Bridge is
struck a third time, Anthropic's record IPO debuts on the Nasdaq, GTA VI
launches worldwide, Gaza's ground operation crosses the ceasefire line, and
Voyager 1 reaches one light-day from the Sun.

## Build

`main.ts` (Node 22, stdlib only, no network) composites a 1024×1024 PNG
from the indexed-colour photo assets in `assets/` and writes it to
`$MAKEFUN_OUTPUT_DIR/entry.png` (or `/output/entry.png`).

```sh
node main.ts
```

The six photos were generated as editorial illustrations and converted to
deterministic indexed-colour assets with `tools/convert.py` (Python + PIL).
Two runs produce byte-identical output.
