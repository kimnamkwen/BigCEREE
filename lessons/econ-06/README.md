# 6주차(비용효용분석) 수업 자료 폴더

이 폴더의 파일은 `classes/economic-evaluation/06-cost-utility/present/` 수업 화면에서 자동으로 불러옵니다.

| 파일 | 용도 |
|---|---|
| `econ-06-slides.pdf` | 상단 **원본 PDF** 버튼 |
| `original-p01.webp` ~ `original-p25.webp` | 각 절의 **원본 슬라이드 보기** (파일이 없으면 "준비 중" 상자 표시) |

슬라이드 이미지 만들기 (PDF → webp, 예: Windows/Mac에 poppler·ImageMagick 설치 시)

```
pdftoppm -r 110 -png econ-06-slides.pdf original-p
# 생성된 original-p-01.png ... 를 original-p01.webp 로 변환
magick mogrify -format webp -quality 80 original-p-*.png
```

PNG/JPG를 쓰려면 수업 페이지 상단 `LESSON.slidePattern`의 확장자만 바꾸면 됩니다.
슬라이드 번호와 절의 대응은 수업 페이지의 `<details class="slides" data-from=".." data-to="..">`에서 조정합니다.

공개용 PDF와 슬라이드 이미지는 원본 6강 PDF의 1–25쪽으로 만들었습니다.

- 26쪽(Q&A): 개인 연락처가 있어 제외
- 2쪽: 프로필 사진·전화번호·이메일을 지운 이미지로 교체
- 15·16·19·20·25쪽: 교재(Drummond 4판 Ch.5–6) 표·그림을 '교재 참조' 안내 쪽으로 교체

슬라이드를 다시 만들 때도 위 쪽들은 원본을 그대로 올리지 않습니다.
