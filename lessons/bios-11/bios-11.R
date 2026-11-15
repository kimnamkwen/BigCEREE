# 보건의료통계학 - 부산대학교 김남권 교수

################################################################################
# 11강. 상관분석 · 회귀분석
################################################################################

# Library

library(olsrr)   # ols_regress 함수 (11-2 회귀분석)

# Working directory

setwd("")

getwd()

vas <- read.csv("vas.csv")

head(vas)

str(vas)

################################################################################
# 11-1. Correlation analysis
################################################################################

# 1. Correlation Plots

attach(vas)

plot(formula = qol ~ cost)

fit1 <- lm(qol ~ cost, data = vas)

summary(fit1)

abline(fit1)

# 2. Variance and Covariance

a1 <- var(qol)
a2 <- var(cost)
a3 <- cov(qol, cost)

r <- a3/sqrt(a1*a2)
r

n <- nrow(vas)
n

t <- r*sqrt((n-2)/(1-r^2))
t

p <- 2*(1-pt(abs(t), df=n-2))

p

# 3. Correlation analysis

cor(qol, cost, method = "pearson")
cor(qol, cost, method = "kendall")
cor(qol, cost, method = "spearman")

cor.test(qol, cost)

# 4. Correlation analysis with pairwise

cor(qol, cost, method = "pearson", use = "complete.obs")

################################################################################
# 11-2. Regression analysis
################################################################################

# Regression table

fit <- lm(formula = cost ~ qol)

# ANOVA table

aov(fit)

# Regression table

summary(fit)
ols_regress(fit)

# prediction and RMSE

pred <- predict(fit)

rmse <- sqrt(mean((pred-vas$cost)^2))

rmse

sx <- sqrt(var(qol))
sx

se <- rmse/(sx*sqrt(n))
se

# Regression figure

plot(formula = cost ~ qol)

abline(fit)

# Regression diagnosis plot

opar <- par(mfrow = c(2,2), oma = c(0, 0, 1.1, 0))
plot(fit, las=1)
par(opar)

# Finishing

detach(vas)

rm(list=ls())
