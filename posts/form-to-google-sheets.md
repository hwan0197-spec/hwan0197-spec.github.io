---
title: "상담 신청 폼을 구글 스프레드시트로 받는 법 (무료, 서버 없이)"
description: "홈페이지나 랜딩페이지의 신청 폼 내용을 내 구글 시트에 자동으로 쌓는 방법입니다. 복사해서 쓰는 코드와 설정 순서, 자주 막히는 부분까지 정리했습니다."
date: 2026-09-30
category: 자동화
---

랜딩페이지에 상담 신청 폼을 달면 "신청 내용은 어디로 받지?"가 다음 고민입니다. 유료 폼 서비스나 서버 없이도 **구글 스프레드시트 + Apps Script**만으로 무료로 받을 수 있습니다.

완성하면 이렇게 동작합니다.

1. 방문자가 페이지에서 이름·연락처를 입력하고 신청
2. 내 구글 시트에 한 줄씩 자동으로 추가
3. 휴대폰 구글 시트 앱으로 바로 확인

> 준비물: 구글 계정 하나, 폼을 넣을 HTML 페이지. 코딩을 몰라도 아래 코드를 복사해서 쓰면 됩니다.

## 1단계: 스프레드시트 만들기

1. [구글 시트](https://sheets.google.com)에서 새 스프레드시트를 만듭니다.
2. 아래쪽 시트 탭 이름을 `신청`으로 바꿉니다.
3. 1행에 아래 제목을 **영어 그대로** 입력합니다. 폼의 입력 칸 이름과 같아야 해서 철자가 중요해요.

| A1 | B1 | C1 | D1 | E1 |
|---|---|---|---|---|
| timestamp | name | phone | program | memo |

제목 옆에 한글 설명이 필요하면 2행이 아니라 **메모 기능**을 쓰세요. 2행에 글을 쓰면 신청 내용과 섞입니다.

## 2단계: Apps Script 코드 붙여넣기

1. 스프레드시트 메뉴에서 **확장 프로그램 → Apps Script**를 엽니다.
2. 기본으로 있는 코드를 모두 지우고 아래 코드를 붙여넣습니다.
3. 저장(💾)을 누릅니다.

```js
const SHEET_NAME = '신청';

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000); // 동시에 여러 명이 신청해도 줄이 겹치지 않게

  try {
    // 스팸 봇이 숨은 칸(website)을 채우면 저장하지 않음
    if (e.parameter.website) return json({ result: 'success' });

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const row = headers.map(h => (h === 'timestamp' ? new Date() : e.parameter[h] || ''));
    sheet.appendRow(row);

    return json({ result: 'success' });
  } catch (err) {
    return json({ result: 'error', message: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
```

1행 제목과 같은 이름으로 들어온 값만 해당 칸에 저장됩니다. 나중에 받을 항목을 늘리고 싶으면 **시트 1행에 제목을 추가하고, 폼에도 같은 이름의 칸을 추가**하면 됩니다. 코드는 고칠 필요가 없어요.

## 3단계: 웹 앱으로 배포하기

1. 오른쪽 위 **배포 → 새 배포**를 누릅니다.
2. 톱니바퀴(유형 선택)에서 **웹 앱**을 고릅니다.
3. 설정을 이렇게 맞춥니다.
   - 다음 사용자 인증 정보로 실행: **나**
   - 액세스 권한이 있는 사용자: **모든 사용자**
4. **배포**를 누르고 권한 요청을 승인합니다.
5. 마지막 화면의 **웹 앱 URL**(`https://script.google.com/macros/s/.../exec`)을 복사해 둡니다.

**"Google에서 확인하지 않은 앱" 경고가 나올 때**
내가 만든 스크립트라서 나오는 정상적인 경고입니다. **고급 → (프로젝트 이름)(으)로 이동**을 누르면 됩니다.

**"모든 사용자"로 해도 괜찮을까?**
이 설정은 "누구나 이 주소로 신청서를 **보낼 수** 있다"는 뜻이고, 시트를 **볼 수 있다**는 뜻이 아닙니다. 시트는 여전히 내 계정에서만 보입니다.

## 4단계: 페이지에 폼 넣기

아래 코드를 랜딩페이지에서 폼을 넣을 위치에 붙여넣고, `여기에_웹앱_URL` 부분만 3단계에서 복사한 주소로 바꾸세요.

```html
<form id="consult-form">
  <input name="name" placeholder="이름" required>
  <input name="phone" type="tel" placeholder="연락처" required>
  <select name="program">
    <option value="">관심 항목 선택</option>
    <option>체형 교정</option>
    <option>통증 재활</option>
  </select>
  <textarea name="memo" placeholder="문의 내용 (선택)"></textarea>

  <!-- 스팸 방지용 숨은 칸: 사람에게는 보이지 않음 -->
  <input name="website" tabindex="-1" autocomplete="off"
         style="position:absolute;left:-9999px" aria-hidden="true">

  <label>
    <input type="checkbox" required>
    개인정보 수집·이용에 동의합니다
    (항목: 이름, 연락처 / 목적: 상담 안내 / 보관: 상담 종료 후 1년)
  </label>
  <button type="submit">상담 신청하기</button>
  <p id="form-msg" role="status"></p>
</form>

<script>
  const SCRIPT_URL = '여기에_웹앱_URL';
  const form = document.getElementById('consult-form');
  const msg = document.getElementById('form-msg');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button');
    btn.disabled = true;
    msg.textContent = '보내는 중...';
    try {
      const res = await fetch(SCRIPT_URL, { method: 'POST', body: new FormData(form) });
      const data = await res.json();
      if (data.result !== 'success') throw new Error(data.message);
      form.reset();
      msg.textContent = '신청이 접수되었습니다. 곧 연락드릴게요!';
    } catch (err) {
      msg.textContent = '전송에 실패했어요. 잠시 후 다시 시도하거나 전화로 문의해 주세요.';
    } finally {
      btn.disabled = false;
    }
  });
</script>
```

스타일(CSS)은 페이지 디자인에 맞게 따로 입히면 됩니다.

## 5단계: 테스트하기

1. 페이지에서 직접 한 번 신청해 봅니다.
2. 시트에 한 줄이 추가됐는지 확인합니다.
3. 휴대폰에서도 한 번 더 신청해 봅니다.

## 자주 막히는 부분

**시트에 아무것도 안 들어와요**
- 시트 탭 이름이 정확히 `신청`인지 확인하세요. 띄어쓰기도 구분합니다.
- 1행 제목과 폼 칸의 `name`이 철자까지 같은지 확인하세요.

**코드를 고쳤는데 반영이 안 돼요**
Apps Script는 코드를 저장만 해서는 배포된 웹 앱에 반영되지 않습니다. **배포 → 배포 관리 → 연필(수정) → 버전: 새 버전 → 배포**를 해야 같은 URL에 새 코드가 적용됩니다. "새 배포"를 누르면 URL이 바뀌니 주의하세요.

**전송 실패 메시지가 떠요**
- 3단계에서 액세스 권한을 **모든 사용자**로 했는지 확인하세요.
- URL이 `/exec`로 끝나는지 확인하세요. `/dev`는 테스트용이라 다른 사람은 쓸 수 없습니다.

## 신청이 오면 메일로 알림 받기 (선택)

2단계 코드에서 `sheet.appendRow(row);` 바로 아래에 다음 한 줄을 추가하세요.

```js
    MailApp.sendEmail(Session.getEffectiveUser().getEmail(), '새 상담 신청', row.join('\n'));
```

신청이 들어올 때마다 내 구글 계정 메일로 내용이 옵니다. 추가한 뒤에는 **새 버전으로 다시 배포**하고, 메일 발송 권한도 한 번 더 승인해야 합니다. 무료 계정은 하루에 보낼 수 있는 메일 수에 한도가 있지만, 상담 신청 알림 정도로는 충분합니다.

## 개인정보 관리도 챙기세요

신청 폼으로 이름과 연락처를 받는 순간 개인정보를 다루게 됩니다.

- 폼에 **수집 항목, 이용 목적, 보관 기간**을 적고 동의를 받으세요.
- 시트 공유 설정은 **나만 보기**로 두고, 링크 공유를 켜지 마세요.
- 보관 기간이 지난 신청 내용은 정기적으로 지우세요.

## 정리

- 구글 시트 + Apps Script로 **무료로, 서버 없이** 신청 폼을 운영할 수 있습니다.
- 시트 1행 제목과 폼 칸 이름만 맞추면 항목을 자유롭게 늘릴 수 있어요.
- 코드를 바꾼 뒤에는 **배포 관리에서 새 버전으로** 다시 배포해야 반영됩니다.

폼을 넣을 페이지 구성이 고민이라면 [상담 신청이 들어오는 랜딩페이지 구성 순서](/posts/landing-page-structure/)도 함께 보세요.
