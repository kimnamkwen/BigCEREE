# 보건의료통계학 - 부산대학교 김남권 교수

################################################################################
# 4강. 통계학과 의학연구
################################################################################

##### 01. 패키지

library(lessR)   # details 함수

##### 02. Working directory

setwd("")

getwd()

##### 03. 데이터

vas <- read.csv("vas.csv")

dim(vas)
str(vas)
head(vas)
names(vas)
details(vas)

##### 04. 기저분석

# 변수 생성 : agegrp

vas$agegrp <- ifelse(vas$age>25, 1, 0)
table(vas$agegrp)


# 평균 신뢰구간 분석 : age, qol

mean(vas$age[vas$treat==0])
mean(vas$age[vas$treat==1])
sd(vas$age[vas$treat==0])
sd(vas$age[vas$treat==1])

tapply(vas$age, vas$treat, mean)
tapply(vas$age, vas$treat, sd)

attach(vas)
tapply(age, treat, mean)
tapply(age, treat, sd)

# 빈도수 퍼센트 분석 : sex, agegrp, ses

table(sex, treat)
t_sex <- table(sex, treat)
t_sex
prop.table(t_sex, margin=2)*100 # 각 치료군의 퍼센트 합이 100이 되도록 출력

detach(vas)

################################################################################
