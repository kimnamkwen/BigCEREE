# 보건의료통계학 - 부산대학교 김남권 교수

################################################################################
# 8강. 가설검정 개요
################################################################################

##### 1. 패키지

library(gmodels)   # CrossTable 함수
library(ggplot2)   # 기술통계 그래프

##### 2. 기술통계 분석 : mean, sd, table, tapply, CrossTable 함수

# Working directory

setwd("")

getwd()

vas <- read.csv("vas.csv")

# 기술통계 분석

mean(vas$age)
sd(vas$age)

mean(vas$age[vas$treat==0])
mean(vas$age[vas$treat==1])

sd(vas$age[vas$treat==0])
sd(vas$age[vas$treat==1])

table(vas$sex, vas$treat)

tapply(vas$age, vas$treat, mean)
tapply(vas$age, vas$treat, sd)

round(tapply(vas$age, vas$treat, mean),2)
round(tapply(vas$age, vas$treat, sd),2)

round(tapply(vas$qol, vas$treat, mean),2)
round(tapply(vas$qol, vas$treat, sd),2)

round(tapply(vas$vas_1, vas$treat, mean),2)
round(tapply(vas$vas_1, vas$treat, sd),2)

CrossTable(vas$sex, vas$treat)

CrossTable(vas$ses, vas$treat)

vas$agg <- ifelse(vas$age>39,1, 0)

##### 3. 기술통계 그래프 : ggplot2 함수

# Histogram

hist(vas$age)

ggplot(data=vas, aes(x=age)) +
  geom_histogram()

ggplot(data=vas, aes(x=age, fill=as.factor(treat))) +
  geom_histogram()

ggplot(data = vas, aes(x = age, fill = as.factor(treat))) +
  geom_histogram(position = "identity", alpha = 0.5, bins = 30) +
  labs(fill = "Treatment") # 범례 제목 변경

# Bar plot

barplot(table(vas$sex, vas$treat), legend.text = c("sex=0", "sex=1"),
        names.arg = c("Control", "Treatment"))

ggplot(data=vas, aes(x=as.factor(treat), fill = as.factor(sex))) +
  geom_bar()

ggplot(data=vas, aes(x=as.factor(treat), fill = as.factor(sex))) +
  geom_bar() +
  scale_x_discrete(labels = c("0" = "Control", "1" = "Treatment")) +
  labs(x="Treatment", fill = "Sex")
