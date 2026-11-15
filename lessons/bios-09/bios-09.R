# 보건의료통계학 - 부산대학교 김남권 교수

################################################################################
# 9강. 평균비교
################################################################################

# 이 강의는 R 기본 함수(stats)만 사용하므로 별도 패키지가 필요 없습니다.

# Working directory

setwd("")

getwd()

vas <- read.csv("vas.csv")

head(vas)

str(vas)

# 1. One sample mean test

shapiro.test(vas$age)

t.test(vas$age, mu=30)

# 2. Independent t test

shapiro.test(vas$age[vas$treat==0])
shapiro.test(vas$age[vas$treat==1])

by(vas$age, vas$treat, shapiro.test)

var.test(age ~ treat, data=vas)

# 참고 정규성 그래프 검토 : 창을 1행 2열로 나누어 두 그룹의 plot을 동시 확인
par(mfrow = c(1, 2))
qqnorm(vas$age[vas$treat == unique(vas$treat)[1]], main = paste("Q-Q Plot:", unique(vas$treat)[1]))
qqline(vas$age[vas$treat == unique(vas$treat)[1]], col = "red")

qqnorm(vas$age[vas$treat == unique(vas$treat)[2]], main = paste("Q-Q Plot:", unique(vas$treat)[2]))
qqline(vas$age[vas$treat == unique(vas$treat)[2]], col = "red")
par(mfrow = c(1, 1)) # 그래프 설정 초기화

t.test(age ~ treat, data=vas)

t.test(age ~ treat, data=vas, var.equal = T)

boxplot(age ~ treat, data=vas)

# 3. Paired t test

vas$diff <- vas$vas_2 - vas$vas_1

shapiro.test(vas$diff)

t.test(vas$vas_1, vas$vas_2, paired = TRUE)

boxplot(vas$vas_1, vas$vas_2)

rm(list=ls())

################################################################################
