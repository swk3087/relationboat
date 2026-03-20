import iconv from 'iconv-lite';

type ParsedProperty = {
  value: string;
  params: Record<string, string>;
};

export type ParsedVcardContact = {
  name: string;
  phone: string | null;
  memo: string | null;
};

const scoreDecodedText = (value: string) => {
  const replacementCharCount = (value.match(/\uFFFD/g) ?? []).length;
  return replacementCharCount;
};

const decodeFileText = (buffer: Buffer) => {
  const utf8 = buffer.toString('utf8');
  const eucKr = iconv.decode(buffer, 'euc-kr');
  return scoreDecodedText(utf8) <= scoreDecodedText(eucKr) ? utf8 : eucKr;
};

const unfoldLines = (text: string) => {
  const rawLines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const unfolded: string[] = [];

  for (let index = 0; index < rawLines.length; index += 1) {
    let line = rawLines[index];

    while (line.endsWith('=') && index + 1 < rawLines.length) {
      index += 1;
      line = `${line.slice(0, -1)}${rawLines[index].replace(/^[ \t]/, '')}`;
    }

    if (/^[ \t]/.test(line) && unfolded.length > 0) {
      unfolded[unfolded.length - 1] += line.slice(1);
    } else {
      unfolded.push(line);
    }
  }

  return unfolded;
};

const parseParams = (segments: string[]) => {
  const params: Record<string, string> = {};

  for (const segment of segments) {
    const [rawKey, ...rawValueParts] = segment.split('=');
    const key = rawKey.trim().toUpperCase();
    if (!key) continue;

    if (rawValueParts.length === 0) {
      params.TYPE = params.TYPE ? `${params.TYPE},${key}` : key;
      continue;
    }

    params[key] = rawValueParts.join('=').trim();
  }

  return params;
};

const decodeQuotedPrintable = (value: string) => {
  const bytes: number[] = [];

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (char === '=' && index + 2 < value.length) {
      const hex = value.slice(index + 1, index + 3);
      if (/^[0-9A-Fa-f]{2}$/.test(hex)) {
        bytes.push(Number.parseInt(hex, 16));
        index += 2;
        continue;
      }
    }
    bytes.push(char.charCodeAt(0));
  }

  return Buffer.from(bytes);
};

const decodeValueByEncoding = (rawValue: string, params: Record<string, string>) => {
  const charset = params.CHARSET?.trim() || 'utf-8';
  const encoding = params.ENCODING?.toUpperCase();
  let buffer: Buffer;

  if (encoding === 'QUOTED-PRINTABLE') {
    buffer = decodeQuotedPrintable(rawValue);
  } else if (encoding === 'B' || encoding === 'BASE64') {
    buffer = Buffer.from(rawValue, 'base64');
  } else {
    buffer = Buffer.from(rawValue, 'binary');
  }

  try {
    return iconv.decode(buffer, charset);
  } catch {
    return buffer.toString('utf8');
  }
};

const unescapeVcardValue = (value: string) =>
  value
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');

const parseCard = (lines: string[]) => {
  const properties = new Map<string, ParsedProperty[]>();

  for (const line of lines) {
    const separator = line.indexOf(':');
    if (separator < 0) continue;

    const rawName = line.slice(0, separator);
    const rawValue = line.slice(separator + 1);
    const [propertyName, ...segments] = rawName.split(';');
    const key = propertyName.trim().toUpperCase();
    if (!key) continue;

    const params = parseParams(segments);
    const decodedValue = unescapeVcardValue(decodeValueByEncoding(rawValue, params));
    const values = properties.get(key) ?? [];
    values.push({ value: decodedValue, params });
    properties.set(key, values);
  }

  return properties;
};

const cleanName = (value: string | null | undefined) => {
  const normalized = value?.normalize('NFKC').replace(/\s+/g, ' ').trim();
  return normalized && normalized.length > 0 ? normalized : '이름없음';
};

const normalizePhone = (value: string | null | undefined) => {
  if (!value) return null;
  const normalized = value.replace(/[^\d+]/g, '').trim();
  if (!normalized) return null;
  return normalized.startsWith('00') ? `+${normalized.slice(2)}` : normalized;
};

const pickName = (properties: Map<string, ParsedProperty[]>) => {
  const formatted = properties.get('FN')?.find((item) => item.value.trim().length > 0)?.value;
  if (formatted) return cleanName(formatted);

  const structured = properties.get('N')?.find((item) => item.value.trim().length > 0)?.value;
  if (structured) {
    const [familyName, givenName, additionalName, prefix, suffix] = structured
      .split(';')
      .map((value) => value.trim())
      .filter(Boolean);

    const combined = [prefix, givenName, additionalName, familyName, suffix].filter(Boolean).join(' ');
    return cleanName(combined || structured.replace(/;/g, ' '));
  }

  return '이름없음';
};

const pickPhone = (properties: Map<string, ParsedProperty[]>) => {
  const phones = properties.get('TEL') ?? [];
  if (phones.length === 0) return null;

  const preferred =
    phones.find((item) => /(CELL|MOBILE)/i.test(item.params.TYPE ?? '')) ??
    phones.find((item) => /(HOME|WORK)/i.test(item.params.TYPE ?? '')) ??
    phones[0];

  return normalizePhone(preferred.value);
};

const pickMemo = (properties: Map<string, ParsedProperty[]>) => {
  const note = properties.get('NOTE')?.[0]?.value?.trim();
  const org = properties.get('ORG')?.[0]?.value?.trim();

  if (note && org) return `${org} | ${note}`;
  if (note) return note;
  if (org) return org;
  return null;
};

export const parseVcardContacts = (buffer: Buffer): ParsedVcardContact[] => {
  const lines = unfoldLines(decodeFileText(buffer));
  const cards: string[][] = [];
  let inCard = false;
  let currentCard: string[] = [];

  for (const line of lines) {
    const upper = line.trim().toUpperCase();
    if (upper === 'BEGIN:VCARD') {
      inCard = true;
      currentCard = [];
      continue;
    }
    if (upper === 'END:VCARD') {
      inCard = false;
      if (currentCard.length > 0) cards.push(currentCard);
      currentCard = [];
      continue;
    }

    if (inCard) currentCard.push(line);
  }

  const contacts: ParsedVcardContact[] = [];
  const seen = new Set<string>();

  for (const card of cards) {
    const properties = parseCard(card);
    const name = pickName(properties);
    const phone = pickPhone(properties);
    const memo = pickMemo(properties);
    const uniqueKey = `${name.toLowerCase()}|${phone ?? ''}`;
    if (seen.has(uniqueKey)) continue;
    seen.add(uniqueKey);

    contacts.push({ name, phone, memo });
  }

  return contacts;
};
