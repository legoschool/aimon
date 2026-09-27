/* 기록 시각은 한국 시각으로 표시한다. 연도가 없는 옛 표시값은 추측하지 않는다. */
function recordStamp(row) {
  const value = row.t !== undefined ? row.t : row.lastPlayed;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 && !isNaN(new Date(n).getTime()) ? n : 0;
}

function recordWhen(row) {
  const stamp = recordStamp(row);
  if (!stamp) return row.when ? String(row.when) + " (원본 표시)" : "날짜 정보 없음";
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23"
  }).format(new Date(stamp));
}

function sortRecordRows(rows, order) {
  const compare = function (a, b) {
    return String(a || "").localeCompare(String(b || ""), "ko", { numeric: true });
  };
  return rows.slice().sort(function (a, b) {
    const identity = compare(a.klass, b.klass) || compare(a.number, b.number) || compare(a.nick, b.nick);
    if (order === "student") return identity || recordStamp(b) - recordStamp(a);
    if (order === "progress") return (Number(b.caught) || 0) - (Number(a.caught) || 0) || identity;
    return recordStamp(b) - recordStamp(a) || identity;
  });
}
