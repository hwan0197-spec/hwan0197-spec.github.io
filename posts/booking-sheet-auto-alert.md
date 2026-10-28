---
title: "예약 시트에 자동 알림 붙이는 법 (새 예약 메일 + 매일 아침 오늘 예약 요약)"
description: "구글 설문지로 받은 예약을 놓치지 않도록, 새 예약이 들어오면 바로 메일을 받고 매일 아침 오늘 예약 목록을 받아보는 방법입니다. 복사해서 쓰는 코드와 한도, 주의할 점까지 정리했습니다."
date: 2026-10-29
category: 자동화
draft: true
---

구글 설문지로 예약을 받기 시작하면 금방 이런 일이 생깁니다. 시트를 열어 보기 전까지는 새 예약이 들어온 줄 모르고, 아침마다 "오늘 누가 오시더라?" 하고 시트를 뒤지게 되죠.

이 글에서는 **구글 설문지 + 구글 시트 + Apps Script**만으로, 추가 비용 없이 두 가지 알림을 붙여 보겠습니다.

1. 새 예약이 들어오면 **바로 메일**로 받기
2. 매일 아침 **오늘 예약 목록**을 메일로 받기

> 이 글의 한도와 동작 방식은 2026년 10월 29일에 Google 공식 문서([Apps Script 할당량](https://developers.google.com/apps-script/guides/services/quotas), [설치형 트리거](https://developers.google.com/apps-script/guides/triggers/installable), [양식 응답 보고 관리하기](https://support.google.com/docs/answer/139706?hl=ko))를 기준으로 확인했습니다. 화면과 한도는 바뀔 수 있으니 실제 화면 안내를 함께 보세요.

## 먼저, 알림 방법 3가지 비교

| 방법 | 설정 난이도 | 알림 내용 | 이런 분께 |
|---|---|---|---|
| 설문지 기본 응답 알림 | 클릭 몇 번 | "새 응답이 있다"는 알림 | 일단 놓치지만 않으면 될 때 |
| Apps Script 즉시 알림 | 코드 붙여넣기 | 이름·날짜·연락처 등 예약 내용 전체 | 메일만 보고 바로 연락하고 싶을 때 |
| Apps Script 아침 요약 | 코드 붙여넣기 | 오늘 날짜 예약만 모아서 | 하루 일정을 한눈에 보고 싶을 때 |

가장 간단한 건 설문지 자체 기능입니다. 고객센터 안내 기준으로 설문지를 열고 **응답** 탭 → 더보기(⋮) → **새 응답에 대한 이메일 알림 받기**를 누르면 됩니다. 다만 예약 내용을 보려면 결국 설문지나 시트를 열어야 해서, 아래 방법을 같이 쓰면 훨씬 편합니다.

## 준비: 설문지와 시트 연결하기

설문지의 **응답** 탭에서 스프레드시트로 연결해 두세요. 응답이 쌓이는 시트가 생깁니다. 이 글의 코드는 설문지 질문이 아래처럼 되어 있다고 가정합니다.

- 이름 (단답형)
- 연락처 (단답형)
- 예약 날짜 (**날짜** 유형)
- 예약 시간 (드롭다운)

질문 제목이 시트의 1행 제목이 됩니다. 코드에서 `예약 날짜`라는 제목을 찾아 쓰니, 제목을 바꿨다면 코드의 이름도 같이 바꿔 주세요.

> 홈페이지에 직접 만든 HTML 폼으로 시트에 받고 있다면 이 글의 "설문 제출" 트리거는 동작하지 않습니다. 그 경우엔 [상담 신청 폼을 구글 스프레드시트로 받는 법](/posts/form-to-google-sheets/)의 메일 알림 한 줄을 쓰고, 아래 "아침 요약"만 가져다 쓰면 됩니다.

## 코드 붙여넣기

응답 시트에서 **확장 프로그램 → Apps Script**를 열고, 기본 코드를 지운 뒤 아래를 붙여넣고 저장합니다. 맨 위 두 줄만 내 상황에 맞게 바꾸세요.

```js
const ALERT_EMAIL = '내메일@example.com';   // 알림 받을 주소
const SHEET_NAME = '설문지 응답 시트1';      // 응답이 쌓이는 시트 탭 이름
const TZ = 'Asia/Seoul';

// 처음 한 번만 실행: 알림 2개를 등록합니다
function setupTriggers() {
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('notifyNewBooking')
    .forSpreadsheet(SpreadsheetApp.getActive()).onFormSubmit().create();
  ScriptApp.newTrigger('sendTodaySummary')
    .timeBased().everyDays(1).atHour(8).inTimezone(TZ).create();
}

// 새 예약이 들어오면 내용 전체를 메일로
function notifyNewBooking(e) {
  const v = e.namedValues;
  const body = Object.keys(v).map(k => k + ': ' + v[k].join(', ')).join('\n');
  const name = v['이름'] ? v['이름'][0] : '';
  MailApp.sendEmail(ALERT_EMAIL, '[새 예약] ' + name, body);
}

// 매일 아침 오늘 날짜 예약만 모아서 메일로
function sendTodaySummary() {
  const fmt = d => Utilities.formatDate(d, TZ, 'yyyy-MM-dd');
  const today = fmt(new Date());
  const [headers, ...rows] = SpreadsheetApp.getActive()
    .getSheetByName(SHEET_NAME).getDataRange().getValues();
  const col = headers.indexOf('예약 날짜');
  const list = rows.filter(r => r[col] instanceof Date && fmt(r[col]) === today);
  if (list.length === 0) return; // 예약 없는 날은 메일을 보내지 않음

  const body = list.map(r => headers.map((h, i) =>
    h + ': ' + (r[i] instanceof Date ? fmt(r[i]) : r[i])).join('\n')).join('\n\n');
  MailApp.sendEmail(ALERT_EMAIL, `[오늘 예약 ${list.length}건] ${today}`, body);
}
```

저장한 뒤 편집기 위쪽에서 실행할 함수로 **setupTriggers**를 고르고 **실행**을 누릅니다. 권한 승인 창이 뜨면 승인하세요. 내가 만든 스크립트라 "확인되지 않은 앱" 경고가 나올 수 있는데, 고급을 눌러 진행하면 됩니다.

`setupTriggers`는 **한 번만** 실행하면 됩니다. 기존 알림을 지우고 다시 등록하도록 만들어 두어서, 실수로 두 번 눌러도 알림이 겹치지 않아요.

## 테스트하고 확인할 것

- [ ] 설문지에서 직접 예약을 한 번 넣었을 때 **새 예약 메일**이 오는가
- [ ] 예약 날짜를 **오늘**로 넣은 뒤, 편집기에서 `sendTodaySummary`를 직접 실행하면 요약 메일이 오는가
- [ ] 휴대폰 메일 앱에서 알림이 울리도록 설정했는가

아침 요약이 정확히 8시 정각에 오지 않아도 정상입니다. 공식 문서에 따르면 매일 반복 트리거는 지정한 시각부터 한 시간 사이 중 한 시점에 실행되고, 그 시점이 날마다 비슷하게 유지됩니다. 8시대 어딘가에 온다고 생각하시면 됩니다.

## 알아 둘 한도와 주의점

**하루 메일 한도**
Apps Script로 보내는 메일은 하루 받는 사람 수에 한도가 있습니다. 공식 할당량 문서 기준으로 일반 구글 계정(gmail.com)은 **하루 100명**, Google Workspace 계정은 하루 1,500명입니다. 예약 알림을 내 주소로만 받는다면 동네 가게 규모에서는 넉넉한 편이에요. 한도는 예고 없이 바뀔 수 있다고 안내되어 있습니다.

**메일에 개인정보가 담깁니다**
알림 메일에 손님 이름과 연락처가 그대로 들어갑니다. 알림 주소는 **가게 운영자만 보는 메일**로 하고, 여러 직원이 함께 쓰는 공용 메일이라면 꼭 필요한 항목만 메일에 넣도록 줄이는 것도 방법입니다. 설문지에 수집 항목과 보관 기간을 안내하는 것도 잊지 마세요. 문구는 [상담 신청 폼 개인정보 동의 문구 쓰는 법](/posts/privacy-consent-form-text/)을 참고하세요.

**질문 제목을 바꿀 때**
설문지 질문 제목을 바꾸면 시트 1행도 바뀝니다. `예약 날짜`나 `이름`을 바꿨다면 코드 속 같은 글자도 함께 고쳐야 요약이 제대로 나옵니다.

## 정리

- 설문지 기본 알림은 간단하지만, 예약 내용까지 보려면 **Apps Script 알림**이 편합니다.
- 코드를 붙여넣고 `setupTriggers`를 **한 번 실행**하면 즉시 알림과 아침 요약이 함께 등록됩니다.
- 아침 요약은 지정한 시각부터 **한 시간 안**에 도착합니다.
- 일반 구글 계정은 하루 메일 받는 사람 **100명** 한도가 있고, 알림 메일에는 손님 개인정보가 담긴다는 점을 기억하세요.

예약 폼을 넣을 페이지부터 다시 정리하고 싶다면, 예약·상담 버튼이 잘 보이는 구성으로 함께 만들어 드릴 수 있습니다.
