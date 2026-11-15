# 6주차(비용효용분석) 수업 자료 폴더

이 폴더의 파일은 `classes/economic-evaluation/06-cost-utility/present/` 수업 화면에서 자동으로 불러옵니다.

| 파일 | 용도 |
|---|---|
| `econ-06-slides.pdf` | 상단 **원본 PDF** 버튼 |
| `original-p01.webp` ~ `original-p22.webp` | 각 절의 **원본 슬라이드 보기** (파일이 없으면 "준비 중" 상자 표시) |

슬라이드 이미지 만들기 (PDF → webp, 예: Windows/Mac에 poppler·ImageMagick 설치 시)

```
pdftoppm -r 110 -png econ-06-slides.pdf original-p
# 생성된 original-p-01.png ... 를 original-p01.webp 로 변환
magick mogrify -format webp -quality 80 original-p-*.png
```

PNG/JPG를 쓰려면 수업 페이지 상단 `LESSON.slidePattern`의 확장자만 바꾸면 됩니다.
슬라이드 번호와 절의 대응은 수업 페이지의 `<details class="slides" data-from=".." data-to="..">`에서 조정합니다.
