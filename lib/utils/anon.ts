/**
 * registrant_id를 노출하지 않으면서도 같은 사람의 메시지는 항상 같은
 * 이름으로 보이도록, id로부터 결정론적인 익명 별칭을 생성한다.
 */
export function getAnonAlias(registrantId: string): string {
  let hash = 0;
  for (let i = 0; i < registrantId.length; i++) {
    hash = (hash * 31 + registrantId.charCodeAt(i)) >>> 0;
  }
  const num = 1000 + (hash % 9000);
  return `참가자${num}`;
}
