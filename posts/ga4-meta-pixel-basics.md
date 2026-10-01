---
title: "광고 전에 꼭 설치할 GA4와 메타 픽셀 기초 (상담 신청 전환까지)"
description: "구글 애널리틱스(GA4)와 메타 픽셀이 무엇인지, 랜딩페이지 어디에 넣는지, 상담 신청이 들어왔을 때 '전환'으로 기록하는 방법까지 공식 문서 기준으로 정리했습니다."
date: 2026-10-01
category: 마케팅
---

인스타그램이나 네이버·구글에 광고를 돌리기 시작하면 곧 이런 질문이 생깁니다. "광고비를 쓴 만큼 상담 신청이 들어오고 있나?" 이 질문에 답하려면 광고를 켜기 **전에** 랜딩페이지에 측정 코드를 넣어 두어야 합니다. 나중에 넣으면 그 전 기간의 데이터는 되살릴 수 없어요.

이 글에서는 가장 많이 쓰는 두 가지, **GA4**와 **메타 픽셀**의 기초를 다룹니다.

> 코드와 메뉴 이름은 2026년 9월 30일에 Google·Meta 공식 문서에서 확인했습니다. 화면 구성은 바뀔 수 있으니 각 서비스가 보여주는 코드를 그대로 복사해 쓰세요.

## GA4와 메타 픽셀, 각각 무엇인가요?

| | GA4 (구글 애널리틱스 4) | 메타 픽셀 |
|---|---|---|
| 만든 곳 | Google | Meta (페이스북·인스타그램) |
| 주로 보는 것 | 방문자가 어디서 와서 무엇을 했는지 | 메타 광고를 보고 온 사람이 무엇을 했는지 |
| 특히 필요한 경우 | 모든 사이트 (광고 여부와 관계없이) | 인스타그램·페이스북 광고를 할 때 |

둘 다 **페이지에 짧은 코드를 넣는 방식**이고, 한 페이지에 함께 넣어도 됩니다.

## 왜 광고 전에 설치해야 하나요?

- **어떤 광고가 신청으로 이어졌는지** 알 수 있습니다. 클릭 수만 보면 "많이 눌렸는데 신청은 없는" 광고를 구분할 수 없어요.
- GA4에서 "주요 이벤트"로 표시한 행동은 **Google Ads 전환으로 가져와** 쓸 수 있습니다. ([Google 애널리틱스 고객센터](https://support.google.com/analytics/answer/13128484?hl=ko))
- 메타 광고 관리자에서도 픽셀이 보내는 이벤트를 기준으로 결과를 확인합니다.

## 1단계: GA4 설치하기

**측정 ID 만들기** ([Google 애널리틱스 설정 안내](https://support.google.com/analytics/answer/9304153?hl=ko))

1. Google 애널리틱스 **관리**에서 **만들기 → 속성**을 선택하고, 이름·시간대·통화를 입력합니다.
2. **데이터 스트림 → 스트림 추가 → 웹**을 고르고 내 사이트 주소를 입력합니다.
3. 만들어진 스트림에서 `G-`로 시작하는 **측정 ID**를 복사합니다.

**페이지에 코드 넣기**

아래 코드를 페이지의 `<head>` 태그 **바로 다음**에 붙여넣고, `G-XXXXXXXXXX`를 내 측정 ID로 바꾸세요. **두 군데** 있습니다. ([Google 태그 설치 문서](https://developers.google.com/tag-platform/gtagjs/install))

```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-XXXXXXXXXX');
</script>
```

페이지가 여러 개라면 **측정할 모든 페이지**에 넣어야 합니다. 공식 안내에 따르면 설치 후 30분 이내에 데이터 수집이 시작됩니다.

## 2단계: 메타 픽셀 설치하기

1. Meta **이벤트 관리자**(Events Manager)에서 픽셀을 만들고 **픽셀 ID**를 확인합니다.
2. 아래 기본 코드를 `<head>`와 `</head>` 사이에 붙여넣고, `여기에_픽셀_ID`를 내 픽셀 ID로 바꿉니다. 역시 **두 군데**입니다. ([Meta 픽셀 시작하기 문서](https://developers.facebook.com/docs/meta-pixel/get-started))

```html
<!-- Meta Pixel Code -->
<script>
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', '여기에_픽셀_ID');
  fbq('track', 'PageView');
</script>
<noscript>
  <img height="1" width="1" style="display:none"
       src="https://www.facebook.com/tr?id=여기에_픽셀_ID&ev=PageView&noscript=1"/>
</noscript>
<!-- End Meta Pixel Code -->
```

이 코드는 페이지가 열릴 때마다 **PageView(페이지 조회)**를 자동으로 보냅니다. 이벤트 관리자에서 코드를 복사할 수 있다면, 그 코드를 그대로 쓰는 것이 가장 정확합니다.

## 3단계: 상담 신청을 '전환'으로 기록하기

방문 수만으로는 부족합니다. 진짜 궁금한 건 **신청이 몇 건 들어왔는지**예요. 그래서 신청이 **성공한 순간**에 이벤트를 하나 더 보냅니다.

- GA4: 추천 이벤트 `generate_lead` (폼 등으로 잠재 고객이 생겼을 때) — [GA4 추천 이벤트 문서](https://developers.google.com/analytics/devguides/collection/ga4/reference/events?client_type=gtag#generate_lead)
- 메타: 표준 이벤트 `Lead` — [메타 픽셀 표준 이벤트 문서](https://developers.facebook.com/docs/meta-pixel/reference)

[상담 신청 폼을 구글 시트로 받는 법](/posts/form-to-google-sheets/)의 코드를 쓰고 있다면, `form.reset();` 바로 위에 두 줄을 추가하면 됩니다.

```js
      const data = await res.json();
      if (data.result !== 'success') throw new Error(data.message);

      // 신청 성공 시에만 전환 기록
      if (typeof gtag === 'function') gtag('event', 'generate_lead');
      if (typeof fbq === 'function') fbq('track', 'Lead');

      form.reset();
```

**버튼을 누른 순간이 아니라 저장에 성공한 뒤**에 보내는 것이 핵심입니다. 그래야 전송에 실패한 경우까지 신청으로 세지 않아요. `typeof ... === 'function'` 확인은 코드가 아직 안 불러와졌을 때 오류가 나지 않게 하는 안전장치입니다.

GA4 문서에서는 이 이벤트를 주요 이벤트로 쓸 경우 금액(`value`)과 통화(`currency`)를 함께 보내길 권장합니다. 상담 한 건의 가치를 정하기 어렵다면 우선 위처럼 건수만 기록해도 됩니다.

## 4단계: GA4에서 주요 이벤트로 표시하기

GA4에서는 상담 신청처럼 중요한 행동을 **주요 이벤트**로 표시해 따로 집계합니다. ([주요 이벤트 안내](https://support.google.com/analytics/answer/13128484?hl=ko))

1. **관리 → 데이터 표시 → 이벤트**로 들어갑니다.
2. 테스트 신청을 한 뒤 목록에 `generate_lead`가 보이면, 이름 옆의 **별표**를 눌러 주요 이벤트로 표시합니다.
3. 아직 목록에 없다면 **+ 이벤트 만들기**에서 같은 이름으로 만들고 **주요 이벤트로 표시**를 켭니다.

## 설치 확인 체크리스트

- [ ] [Tag Assistant](https://tagassistant.google.com)로 내 페이지에서 Google 태그가 동작하는지 확인했나요? ([Google 문서](https://developers.google.com/tag-platform/gtagjs/install))
- [ ] Meta 이벤트 관리자에서 내 픽셀에 **PageView**가 들어왔나요? 크롬 확장 프로그램 **Meta Pixel Helper**로도 확인할 수 있습니다. ([Meta 문서](https://developers.facebook.com/docs/meta-pixel/get-started))
- [ ] 테스트 신청 후 GA4에 `generate_lead`, 메타에 `Lead`가 들어왔나요?
- [ ] 측정 ID와 픽셀 ID를 **두 군데 모두** 바꿨나요?

## 개인정보처리방침도 함께 챙기세요

GA4와 메타 픽셀은 쿠키 등을 이용해 방문 정보를 수집합니다. 사이트의 **개인정보처리방침에 이런 분석·광고 도구를 사용한다는 사실**을 적어 두세요. 업종이나 수집 항목에 따라 필요한 내용이 다를 수 있으니, 정확한 문구는 전문가나 관련 기관 안내를 확인하는 것이 좋습니다.

## 정리

- 광고를 켜기 **전에** GA4와 메타 픽셀을 설치해야 처음부터 데이터가 쌓입니다.
- 두 코드 모두 `<head>` 안에 넣고, ID가 **두 군데** 들어간다는 점을 잊지 마세요.
- 상담 신청은 **저장에 성공한 뒤** `generate_lead`(GA4)와 `Lead`(메타)로 기록하고, GA4에서는 주요 이벤트로 표시하세요.
- 페이지 구성이 아직이라면 [상담 신청이 들어오는 랜딩페이지 구성 순서](/posts/landing-page-structure/)부터 보세요.
