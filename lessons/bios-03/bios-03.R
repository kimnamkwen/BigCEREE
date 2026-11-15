# 보건의료통계학 - 부산대학교 김남권 교수

################################################################################
# 3강. 기초통계학
################################################################################

##### 01. 패키지 로드

library(tidyverse)  # filter, slice, arrange, select, rename, mutate, relocate, summarise, ggplot
library(lessR)      # details 함수 : Less Code, More Results
# https://cran.r-project.org/web/packages/lessR/lessR.pdf

##### 02. Working directory

setwd("")

getwd()

##### 03. 데이터 불러오기

vas <- read.csv("vas.csv")

# mpg <- data.frame(ggplot2::mpg)    # 패키지 내장 샘플 데이터 불러오기

##### 04. 데이터 확인

dim(vas)
str(vas)
head(vas)
names(vas)
details(vas)

##### 05. 데이터 정리 : tidyverse(dplyr) - filter, slice, arrange,
# https://dplyr.tidyverse.org/articles/dplyr.html

# filter

df_vas1 <- filter(vas, ses==1 | ses==2)

dim(df_vas1)

# slice

df_vas1 <- slice(df_vas1, 1:30)

dim(df_vas1)
head(df_vas1)

# arrange
df_vas1 <- arrange(df_vas1, age, desc(cost))
head(df_vas1)

##### 06. 변수 정리 : tidyverse(dplyr) - select, rename, mutate, relocate, summarise

# select : 변수 선택 및 제거

df_vas1 <- select(df_vas1, id, treat, sex, age, vas_1)

df_vas1 <- select(df_vas1, -sex)

head(df_vas1)

# rename : 변수명 변경

df_vas1 <- dplyr::rename(df_vas1, age2 = age)  # age 변수명을 age2로 변환

# mutate : 변수 생성

df_vas1 <- mutate(df_vas1, agegrp = ifelse(age2>25, 1,0))
names(df_vas1)

# relocate : 변수 위치 변경

df_vas1 <- relocate(df_vas1, treat, .before=1)
names(df_vas1)

df_vas1 <- relocate(df_vas1, agegrp, .after=age2)
names(df_vas1)

# summarise

summarise(df_vas1, meanage=mean(age2, na.rm=TRUE))

dim(df_vas1)
str(df_vas1)
head(df_vas1)
names(df_vas1)
summary(df_vas1)
details(df_vas1)

View(df_vas1)

# 기타 변수 관리 방법

df_vas2 <- vas

df_vas2$vasdiff <- df_vas2$vas_1 - df_vas2$vas_2

summary(df_vas2$vasdiff)

df_vas2$vasmean <- (df_vas2$vas_1 + df_vas2$vas_2)/2

summary(df_vas2$vasmean)

hist(df_vas2$vasdiff,border = "blue")

##### 07. 간단한 그래프

hist(vas$cost)

plot(y=vas$vas_1, x=vas$cost)

scatter.smooth(y=vas$vas_1, x=vas$cost)

ggplot(vas, aes(x=age, y=cost)) +
  geom_point()

# 그래프의 파일 저장

jpeg(filename = "sample_histogram.jpeg", width=600, height = 300)    #jpeg device on
hist(vas$cost)
dev.off()   # device off

# 다음 시간
# 진단검사법 : 함수생성
# 직접 해 보세요.

# http://getthediagnosis.org/
# Elevated AST: Sensitivity, Specificity 검사 정보를 활용하여 사전확률 30% 환자
# 간질환 확률을 추정 하시오(양성, 음성).
