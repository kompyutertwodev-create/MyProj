import { randomUUID } from 'node:crypto';
import { PolicyEffect } from './PolicyEffect.js';
import type { AttributeCondition } from './AttributeCondition.js';
import { evaluateCondition } from './AttributeCondition.js';

export interface PolicyProps {
  id: string;
  name: string;
  description: string;
  effect: PolicyEffect;
  /**
   * Who this policy applies to.
   * Supported matchers:
   *   - "*"              → everyone
   *   - "role:admin"     → users with role "admin"
   *   - "user:uuid"      → specific user
   *   - "tenant:uuid"    → all users of a tenant
   */
  subjects: string[];
  /**
   * Resource patterns this policy covers.
   * Supports glob-style wildcards: "content:*", "catalog:movie:read"
   */
  resources: string[];
  /**
   * Action patterns: "read", "write", "delete", "*"
   */
  actions: string[];
  /** All conditions must pass for the policy to apply (AND logic). */
  conditions: AttributeCondition[];
  /** Lower priority number = evaluated first. Deny always wins on tie. */
  priority: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export class Policy {
  private constructor(private readonly props: PolicyProps) {}

  static create(input: Omit<PolicyProps, 'id' | 'createdAt' | 'updatedAt'>): Policy {
    const now = new Date();
    return new Policy({ ...input, id: randomUUID(), createdAt: now, updatedAt: now });
  }

  static reconstitute(props: PolicyProps): Policy {
    return new Policy(props);
  }

  get id(): string {
    return this.props.id;
  }
  get name(): string {
    return this.props.name;
  }
  get description(): string {
    return this.props.description;
  }
  get effect(): PolicyEffect {
    return this.props.effect;
  }
  get subjects(): string[] {
    return this.props.subjects;
  }
  get resources(): string[] {
    return this.props.resources;
  }
  get actions(): string[] {
    return this.props.actions;
  }
  get conditions(): AttributeCondition[] {
    return this.props.conditions;
  }
  get priority(): number {
    return this.props.priority;
  }
  get isActive(): boolean {
    return this.props.isActive;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
  get createdBy(): string {
    return this.props.createdBy;
  }

  /**
   * Check whether this policy applies to the given subject + resource + action
   * and (if so) whether all attribute conditions pass.
   *
   * Returns null if the policy does not match at all (no opinion).
   * Returns PolicyEffect if it matches.
   */
  evaluate(
    subjectDescriptors: string[],
    resource: string,
    action: string,
    context: Record<string, unknown>
  ): PolicyEffect | null {
    if (!this.isActive) return null;

    const subjectMatch = this.props.subjects.some(
      (s) => s === '*' || subjectDescriptors.includes(s)
    );
    if (!subjectMatch) return null;

    const resourceMatch = this.props.resources.some((r) => r === '*' || globMatch(r, resource));
    if (!resourceMatch) return null;

    const actionMatch = this.props.actions.some((a) => a === '*' || a === action);
    if (!actionMatch) return null;

    const conditionsPass = this.props.conditions.every((c) => evaluateCondition(c, context));
    if (!conditionsPass) return null;

    return this.props.effect;
  }

  activate(): void {
    (this.props as PolicyProps).isActive = true;
  }
  deactivate(): void {
    (this.props as PolicyProps).isActive = false;
  }

  updateName(name: string): void {
    (this.props as PolicyProps).name = name;
    (this.props as PolicyProps).updatedAt = new Date();
  }

  updateDescription(description: string): void {
    (this.props as PolicyProps).description = description;
    (this.props as PolicyProps).updatedAt = new Date();
  }

  updateEffect(effect: PolicyEffect): void {
    (this.props as PolicyProps).effect = effect;
    (this.props as PolicyProps).updatedAt = new Date();
  }

  updateSubjects(subjects: string[]): void {
    (this.props as PolicyProps).subjects = subjects;
    (this.props as PolicyProps).updatedAt = new Date();
  }

  updateResources(resources: string[]): void {
    (this.props as PolicyProps).resources = resources;
    (this.props as PolicyProps).updatedAt = new Date();
  }

  updateActions(actions: string[]): void {
    (this.props as PolicyProps).actions = actions;
    (this.props as PolicyProps).updatedAt = new Date();
  }

  updateConditions(conditions: AttributeCondition[]): void {
    (this.props as PolicyProps).conditions = conditions;
    (this.props as PolicyProps).updatedAt = new Date();
  }

  updatePriority(priority: number): void {
    (this.props as PolicyProps).priority = priority;
    (this.props as PolicyProps).updatedAt = new Date();
  }

  toPersistence(): PolicyProps {
    return { ...this.props };
  }
}

/** Simple glob matching: "*" matches any segment, "**" matches across slashes. */
function globMatch(pattern: string, value: string): boolean {
  const regexStr = pattern
    .split('**')
    .map((p) => p.split('*').map(escapeRegex).join('[^:]*'))
    .join('.*');
  return new RegExp(`^${regexStr}$`).test(value);
}

function escapeRegex(s: string): string {
  return s.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
}
