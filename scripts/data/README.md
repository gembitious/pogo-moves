# 참조 데이터

파이프라인(`scripts/build-data.mjs`)과 향후 기능이 쓰는 외부 출처 데이터입니다.

## veekun/pokedex

[veekun/pokedex](https://github.com/veekun/pokedex) `pokedex/data/csv/` (PokéAPI도 동일 데이터 사용).

| 파일 | 원본 | 형식 / 용도 |
| --- | --- | --- |
| `move-names-ko.csv` | `move_names`(영/한 추출, 가공본) | `영문명,한글명` — 파이프라인이 신규 무브 한글명에 사용 |
| `moves-i18n.csv` | `move_names.csv` | `move_id, local_language_id, name` (다국어 무브명) — 향후 UI 다국어용 |
| `species-i18n.csv` | `pokemon_species_names.csv` | `species_id, local_language_id, name, genus` (다국어 포켓몬명·분류) — 향후 포켓몬 기능용 |

`local_language_id`: **3=한국어, 9=영어**, 1=일(가나)·4=중(번체)·5=프·6=독·7=스·8=이·11=일(한자)·12=중(간체).

## pvpoke

[pvpoke](https://github.com/pvpoke/pvpoke) gamemaster — `../src/data/pokemon.json`
(로스터·스탯·기술·진화·그림자). 보존된 스프라이트 + `species-i18n.csv`(한글명)와 함께
"기술↔포켓몬" 기능의 토대입니다. (무브 id가 대문자라 연동 시 소문자화 필요.)

## 포켓몬 인덱스 (데이터 레이어)

`scripts/build-pokemon-index.mjs`가 `src/data/pokemon.json`(pvpoke) + `moves.json` +
`species-i18n.csv`(+ `species-ko-extra.json` override)를 합쳐 클라이언트용 슬림 인덱스를
생성합니다 (`npm run build`에 포함, lazy-fetch용):

- `public/data/pokemon-index.json` — 발매·비그림자 1106종(한/영명·타입·스탯·기술셋·스프라이트)
- `public/data/move-pokemon.json` — 역인덱스 `무브 → 사용 포켓몬`

`species-ko-extra.json`: veekun에 없는 최신종 한글명 override(현재 GO 발매 갭은
dex 1011·1012·1013·1019; PokéAPI는 이 환경에서 403). 스프라이트 누락분은 UI에서
타입색 플레이스홀더 폴백(원하면 PokeMiners pogo_assets로 보충).

## 스프라이트 보강

누락 스프라이트(주로 신규 세대)는 PokeMiners pogo_assets에서 받아옵니다:

- **네트워크 자동 (권장, 클론 불필요)**: `npm run fetch-images` — GitHub tree API로
  스프라이트 폴더를 자동 탐색해 raw에서 누락분만 내려받습니다. rate limit이 걸리면
  `GH_TOKEN=<token> npm run fetch-images`(60→5000/hr). `--dry`(탐색만)·`--all`(전체 재다운로드).
- **오프라인**: PokeMiners 클론 후 `node scripts/build-pokemon-images.mjs <스프라이트폴더>`.

둘 다 `pm####.icon.png`→`{dex}.png`, `pm####.f{FORM}.icon.png`→`{dex}_{form}.png`로 저장
(공유 규칙 `scripts/lib/pokeminers-sprites.mjs`, 메가·연도 코스튬 제외). 받은 뒤 반드시
`npm run build-pokemon-index`로 인덱스를 재생성하세요.

> PokéAPI(이름·스프라이트)와 jsDelivr는 이 클라우드 환경에서 차단(403/allowlist)이라
> PokeMiners raw만 사용합니다.

## 주의

veekun·pvpoke는 메인시리즈/PvP 기준이라 GO 전용 변형(타입별 Hidden Power, 드라이브별 Techno Blast, `_plus`/`_blastoise` 코스메틱, Max 무브)은 빠질 수 있습니다 — 파이프라인이 스킵·리포트합니다.
