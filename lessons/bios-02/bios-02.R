# 보건의료통계학 - 부산대학교 김남권 교수

################################################################################
# 2강. R 개요 (통계분석 프로그램 소개)
################################################################################

# 1. R 정보 확인

sessionInfo()
version

library()
installed.packages()

search()

# 2. package install : 이 강의에서는 그래프용 ggplot2만 사용

# install.packages("ggplot2")

# 3. library 불러오기

library(ggplot2)

search()

# 4. 기초 명령어

print("Hello R")

(1+2)/3

(1+2)/
  +3

10<11

11<=10

r <- rnorm(10, sd =1)

list(r)

?ls

ls

search()

rm(r)

rm(list=ls())

mode(1+2)

mode("1+2")

a <- 1

b <- 2

a+b

var1 <- c(1,2,5,7,8)

var2 <- c(1:5)

var1

var2

var3 <-seq(1,5)

var3

var4 <-seq(1,10,2)

var4

var3 + var4

str <-"a"

drop(str)

str

rm(str)

str4 <- c("a","b","c")

str4

x<- c(1,2,3)

x

mean(x)

max(x)

min(x)

x_mean <-mean(x)

x_mean

str4

str5 <- paste(str4, collapse = " ")

str5


# 5. R 데이터 종류

# Vector

vec1 <- c(2,3,5,7)
vec2 <- c("cat", "dog", "fox", "pig")
vec3 <- c(TRUE, TRUE, FALSE, TRUE)
vec4 <- c(4:1)

# Factor

review <- c("very low","low", "middle", "high", "very high")
review
review.factor <- as.factor(review)
review.factor
str(review.factor)
levels(review.factor)
review.factor.num <- as.numeric(review.factor)
review.factor.num
levels(review.factor.num)
review.factor.num <- as.factor(review.factor.num)
levels(review.factor.num)

# Matrix

mat1 <- matrix(1:12, nrow=3, ncol=4)
mat1

rnames <- c("R1", "R2", "R3")
cnames <- c("C1", "C2", "C3", "C4")
mat2 <- matrix(1:12, 3, 4, dimnames =list(rnames, cnames), byrow=TRUE)
mat2
mat2[2,3]

# Array

ary1 <- array(1:12, dim=c(2,3))
ary1
ary2 <- array(1:24, dim=c(2,3,2))
ary2
ary3 <- array(1:48, dim=c(2,3,2,2,2))
ary3

ary2
ary2[2,3,1]

# Dataframe

data1 <- data.frame(name=c("k","l","n"),
                    math=c(21,31,41),
                    eng=c(22,10,15))
data1

# List

a <- "List Example"
b <- c(1:3)
c <- matrix(1:12, 2, 6)
lst1 <- list(title=a, numbers=b,c)
lst1
lst1$numbers

# 6. Working directory

setwd

setwd("")

getwd()


# 7. 데이터 불러오기

vas <- read.csv("vas.csv")

data()

mpg <- data.frame(ggplot2::mpg)


# 8. 데이터 구조 확인

str(vas)

summary(vas)

head(vas)

mean(vas$age)

table(vas$treat)


# 9. 데이터 수정 및 저장

fix(vas)

a <- data.frame(id=c(1,2,3),
                sex=c(1,0,0),
                age=c(21,31,21))

table(a$sex)

fix(a)

table(a$sex)

# 데이터 저장

write.csv(a, file = "a.csv")

a2 <- read.csv("a.csv")

a2

save(a, file= "a.rda")

load(file="a.rda")


# 10. 간단한 그래프

hist(vas$cost)

plot(y=vas$qol, x=vas$cost)

scatter.smooth(y=vas$qol, x=vas$cost)

ggplot(vas, aes(x=age, y=cost)) +
  geom_point()

# 그래프의 파일 저장

jpeg(filename = "sample_histogram.jpeg", width=600, height = 300)    #jpeg device on
hist(vas$cost)
dev.off()                                                            # device off
