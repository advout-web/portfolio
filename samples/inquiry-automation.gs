/**
 * 問い合わせ管理シートの自動化（中野すまい相談室〔架空〕向けの見本）
 *
 * Googleフォームの回答シート「問い合わせ」に対して、次の3つを自動で行います。
 *   1. 新しい問い合わせが来たら、担当者を順番に割り当てて、社内にメールで知らせる
 *   2. 24時間たっても「未対応」のものがあれば、毎朝まとめて知らせる
 *   3. 毎週月曜の朝に、先週の問い合わせの件数をまとめた週報を送る
 *
 * シートの列：A タイムスタンプ／B お名前／C メールアドレス／D ご用件／E 希望エリア／F お問い合わせ内容
 *             G 担当（自動）／H 状況（自動で「未対応」）／I 割り当て日時（自動）
 * 使い方：設定の3項目を書き換え、setupTriggers を1回だけ実行してください。
 */

// ───── 設定 ─────
const SHEET_NAME = '問い合わせ';
const STAFF = ['佐藤', '鈴木', '高橋'];       // 担当者（この順番で割り当てます）
const NOTIFY_TO = 'team@example.com';           // 社内の通知先

// 列の番号（A列 = 1）
const COL = { time: 1, name: 2, email: 3, kind: 4, area: 5, message: 6, staff: 7, status: 8, assignedAt: 9 };

/** 1. フォームが送信されたとき：担当者を割り当てて通知する */
function onFormSubmit(e) {
  const sheet = e.range.getSheet();
  if (sheet.getName() !== SHEET_NAME) return;

  const row = e.range.getRow();
  const staff = STAFF[(row - 2) % STAFF.length];   // 2行目から順番に割り当て
  sheet.getRange(row, COL.staff, 1, 3).setValues([[staff, '未対応', new Date()]]);

  const v = e.namedValues;  // 項目名 → 回答の配列
  const body = [
    `新しい問い合わせがありました。担当：${staff}`,
    '',
    `お名前　：${v['お名前'][0]} 様`,
    `ご用件　：${v['ご用件'][0]}`,
    `希望エリア：${v['希望エリア'][0]}`,
    '',
    v['お問い合わせ内容'][0],
    '',
    `シートを開く：${SpreadsheetApp.getActive().getUrl()}`,
  ].join('\n');

  MailApp.sendEmail(NOTIFY_TO, `【新しい問い合わせ】${v['ご用件'][0]}｜${v['お名前'][0]} 様（担当：${staff}）`, body);
}

/** 2. 毎朝：24時間以上「未対応」のものを知らせる */
function remindOverdue() {
  const rows = getRows_();
  const limit = Date.now() - 24 * 60 * 60 * 1000;
  const overdue = rows.filter(r => r[COL.status - 1] === '未対応' && new Date(r[COL.time - 1]).getTime() < limit);
  if (overdue.length === 0) return;

  const lines = overdue.map(r =>
    `・${Utilities.formatDate(new Date(r[COL.time - 1]), 'Asia/Tokyo', 'M/d HH:mm')}　${r[COL.name - 1]} 様（${r[COL.kind - 1]}）担当：${r[COL.staff - 1]}`);
  MailApp.sendEmail(NOTIFY_TO, `【要対応】24時間以上 未対応の問い合わせが ${overdue.length} 件あります`, lines.join('\n'));
}

/** 3. 毎週月曜：先週（月〜日）の週報を送る */
function weeklyReport() {
  const end = new Date();
  end.setHours(0, 0, 0, 0);                         // 今日（月曜）の0時
  const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);

  const rows = getRows_().filter(r => {
    const t = new Date(r[COL.time - 1]);
    return t >= start && t < end;
  });

  const countBy = (col) => rows.reduce((acc, r) => {
    const key = r[col - 1] || '（未入力）';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const format = (obj) => Object.entries(obj).sort((a, b) => b[1] - a[1]).map(([k, n]) => `　${k}：${n}件`).join('\n');

  const fmt = (d) => Utilities.formatDate(d, 'Asia/Tokyo', 'M/d');
  const body = [
    `先週（${fmt(start)}〜${fmt(new Date(end.getTime() - 1))}）の問い合わせは ${rows.length} 件でした。`,
    '', '■ ご用件別', format(countBy(COL.kind)),
    '', '■ 担当者別', format(countBy(COL.staff)),
    '', '■ 状況別', format(countBy(COL.status)),
  ].join('\n');

  MailApp.sendEmail(NOTIFY_TO, `【週報】先週の問い合わせ ${rows.length} 件`, body);
}

/** 最初に1回だけ実行：3つの処理を自動で動かす設定をする */
function setupTriggers() {
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));  // 重複を防ぐ
  const ss = SpreadsheetApp.getActive();
  ScriptApp.newTrigger('onFormSubmit').forSpreadsheet(ss).onFormSubmit().create();
  ScriptApp.newTrigger('remindOverdue').timeBased().everyDays(1).atHour(9).create();
  ScriptApp.newTrigger('weeklyReport').timeBased().onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(8).create();
}

/** 見出し行を除いたデータを返す */
function getRows_() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_NAME);
  const last = sheet.getLastRow();
  if (last < 2) return [];
  return sheet.getRange(2, 1, last - 1, COL.assignedAt).getValues();
}
