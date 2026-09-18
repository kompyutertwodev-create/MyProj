export interface SqlQuery {
  text: string;
  values: unknown[];
}

export function sql(strings: TemplateStringsArray, ...values: unknown[]): SqlQuery {
  let text = '';
  const params: unknown[] = [];
  for (let i = 0; i < strings.length; i++) {
    text += strings[i];
    if (i < values.length) {
      params.push(values[i]);
      text += `$${params.length}`;
    }
  }
  return { text, values: params };
}
