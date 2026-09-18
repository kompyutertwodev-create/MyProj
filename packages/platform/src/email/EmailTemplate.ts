export interface EmailTemplate {
  subject: string;
  html?: string;
  text?: string;
}
export function renderTemplate(template: string, variables: Record<string, unknown>): string {
  return template.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (_, key: string) =>
    String(
      key.split('.').reduce<unknown>((v, p) => (v as Record<string, unknown>)?.[p], variables) ?? ''
    )
  );
}
