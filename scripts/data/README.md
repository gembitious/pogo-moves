# 참조 데이터 (veekun/pokedex)

이 폴더의 CSV는 [veekun/pokedex](https://github.com/veekun/pokedex)의
`pokedex/data/csv/` 데이터에서 온 것입니다. (PokéAPI도 동일 데이터를 사용합니다.)

| 파일 | 원본 테이블 | 형식 / 용도 |
| --- | --- | --- |
| `move-names-ko.csv` | `move_names` 의 영/한 추출(가공본) | `영문명,한글명` — 파이프라인이 신규 무브 한글명에 사용 |
| `moves-i18n.csv` | `move_names.csv` | `move_id, local_language_id, name` (다국어 무브명) |
| `species-i18n.csv` | `pokemon_species_names.csv` | `species_id, local_language_id, name, genus` (다국어 포켓몬명·분류) |

`local_language_id` (veekun `languages.csv`): **3=한국어, 9=영어**, 그 외
1=일(가나), 4=중(번체), 5=프, 6=독, 7=스, 8=이, 11=일(한자), 12=중(간체).

## 사용처

- **`move-names-ko.csv`** → `scripts/build-data.mjs`가 영문→한글 사전으로 사용.
  GAME_MASTER엔 한글이 없으므로, 신규 무브의 한글명을 여기서 채워 자동 추가합니다.
- **`moves-i18n.csv`, `species-i18n.csv`** → 현재 미사용. 향후 **UI 다국어 확장**
  (일/중 등)과 **기술↔포켓몬 기능**(한글 포켓몬명·분류)용으로 보존.

> veekun은 메인시리즈 기준이라 GO 전용 변형(타입별 Hidden Power, 드라이브별
> Techno Blast, `_plus`/`_blastoise` 코스메틱, Max 무브)은 없을 수 있습니다 —
> 이런 무브는 파이프라인이 스킵하고 리포트합니다.
