# 보건의료통계학 - 부산대학교 김남권 교수

################################################################################
# 10강. ANOVA
################################################################################

# Library

library(DescTools)   # ScheffeTest 함수

# Working directory

setwd("")

getwd()

vas <- read.csv("vas.csv")

head(vas)
str(vas)
names(vas)

# 1. One way ANOVA

aov <- data.frame(id=c(1:10),
                  treatment=c(1,1,1,2,2,2,3,3,4,4),
                  weight=c(117.5,113.8,104.4,48.9,50.4,58.9,70.4,86.9,87.7,67.3))

aov

aov$treatment<-as.factor(aov$treatment)

aov(weight ~ treatment, data=aov)

aov1 <- aov(weight ~ treatment, data=aov)

summary(aov1)     # summary 함수

tapply(aov$weight, aov$treatment, mean)

tapply(aov$weight, aov$treatment, sd)

# SST <- var(aov$weight) * length(aov$weight) * (length(aov$weight)-1)/length(aov$weight)
# SST

boxplot(weight ~ treatment, data=aov)

# 2. Post Hoc analysis

# Bonferroni

pairwise.t.test(aov$weight, aov$treatment, p.adj = "none")

pairwise.t.test(aov$weight, aov$treatment, p.adj = "bonf")

# TukeyHSD

TukeyHSD(aov1)

# Scheffe

ScheffeTest(aov1)

# 3. One way ANOVA : HA: VAS data에서 사회계층(3그룹)에 따른 vas1 평균이 다른 그룹이 있다.

vas$ses<-as.factor(vas$ses)

aov2 <- aov(vas_1 ~ ses, data=vas)

aov2

summary(aov2)

tapply(vas$vas_1, vas$ses, mean)
tapply(vas$vas_1, vas$ses, sd)

boxplot(vas_1 ~ ses, data=vas)

# 4. Post hoc (직접 해 보세요)


# 5. two way ANOVA

aov3 <- aov(vas_1 ~ ses + treat, data=vas)

summary(aov3)

rm(list=ls())
