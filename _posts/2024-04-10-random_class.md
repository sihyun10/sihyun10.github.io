---
title: "Random 클래스를 활용한 로또 번호 추출 기능 구현"
date: 2024-04-10 23:34:47 +09:00
categories: [Study, Java]
tags: [random]
---  

**Random** 클래스를 활용하여, 로또 번호 추출하는 기능을 구현해보자.   

<br>

**로또 번호 추출 기능**  
- 로또 번호는 1~45 숫자 범위를 가지고 있다.  
- **중복되지 않는** 6개의 숫자를 뽑는다.  
- 단, 항상 실행할때마다 똑같은 결과를 반환하면 안된다.  

<br>

**요구사항**           
- 로또 번호 추출 기능을 실행하는 위치는 `LottoGameMain`의 main()이다.  
  - `Lotto` 클래스의 메서드 기능들을 활용해 로또 번호를 출력하자.  

<br>

**출력 예시**   
```
랜덤으로 추출된 로또 번호입니다.   
[5, 12, 15, 20, 26, 38]
```
- 위와 같이 추출된 번호들을 오름차순으로 출력해주면 된다.  

------------------------------------------------  

### 구현   

```java  
import java.util.Arrays;
import java.util.Random;

public class Lotto {
    private final Random random = new Random();
    private static final int MAXIMUM_COUNT = 6; // 상수
    private int count;
    private int[] lottoNumbers;

    public int[] extract() {
        lottoNumbers = new int[MAXIMUM_COUNT];

        while (count < MAXIMUM_COUNT) {
            int lottoNumber = random.nextInt(45) + 1;
            if (isUnique(lottoNumber)) {
                lottoNumbers[count] = lottoNumber;
                count++;
            }
        }
        return lottoNumbers;
    }

    private boolean isUnique(int lottoNumber) {
        for (int i = 0; i < count; i++) {
            if (lottoNumbers[i] == lottoNumber) {
                return false;
            }
        }
        return true;
    }

    public static String sort(int[] lottoNumbers) {
        for (int i = 0; i < lottoNumbers.length -1; i++) {
            for (int j = i+1; j < lottoNumbers.length; j++) {
                if (lottoNumbers[i] > lottoNumbers[j]) {
                    int temp = lottoNumbers[j];
                    lottoNumbers[j] = lottoNumbers[i];
                    lottoNumbers[i] = temp;
                }
            }
        }
        return Arrays.toString(lottoNumbers);
    }
}
```  

```java
public class LottoGameMain {
    public static void main(String[] args) {
        Lotto lotto = new Lotto();
        int[] lottoNumbers = lotto.extract();

        String result = Lotto.sort(lottoNumbers);
        System.out.println("랜덤으로 추출된 로또 번호입니다.");
        System.out.println(result);
    }
}
```

```
랜덤으로 추출된 로또 번호입니다.
[2, 4, 18, 19, 30, 32]

랜덤으로 추출된 로또 번호입니다.
[11, 13, 24, 25, 30, 34]

// 계속 실행해도 다른 번호들이 추출되는 것을 확인할 수 있다.
```

-------------------------------

### Random 클래스 기능   

- `bound`값을 지정해, 그 값 범위까지의 값을 무작위로 조회  
  - ex) `random.nextInt(5);`는 0~4 범위 내에서 랜덤 값을 출력한다.  
- 하지만, 이때 0부터 시작하기 때문에 대체로 1부터 랜덤값을 추출하고자 하는 경우가 많다.  
  - ex) `random.nextInt(5) + 1;` 을 해주면 1~5 범위 내에서 랜덤 값을 출력한다.
- 따라서 random.nextInt(`bound`) + 1; 을 해주면 1부터 그 범위까지로 랜덤 값을 추출하게 된다.

```java
//1~45 숫자 범위 안에서 랜덤값 추출
Random random = new Random();
int lottoNumber = random.nextInt(45) + 1;
```

- `Boolean`값도 랜덤으로 출력할 수 있다.  
  - `true`, `false` 중에 하나를 추출한다.  

```java
Random random = new Random();
boolean randomBoolean = random.nextBoolean();
```

