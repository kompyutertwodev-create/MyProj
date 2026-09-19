import { AggregateRoot, DomainError, Result, ok, err } from '@workspace/kernel';
import { PolicyId } from './PolicyId.js';
import { PolicyEffect } from './PolicyEffect.js';
import {
  type AttributeCondition,
  evaluateCondition,
} from './AttributeCondition.js';
import {
  PolicyCreatedEvent,
  PolicyUpdatedEvent,
  PolicyActivatedEvent,
  PolicyDeactivatedEvent,
  PolicyDeletedEvent,
} from './events/index.js';

export interface PolicyCreateProps {
  name: string;
  description?: string;
  effect: PolicyEffect;
  subjects: string[];
  resources: string[];
  actions: string[];
  conditions?: AttributeCondition[];
  priority?: number;
  isActive?: boolean;
  createdBy: string;
  tenantId?: string | null;
}

export interface PolicyReconstructProps {
  id: PolicyId;
  name: string;
  description: string;
  effect: PolicyEffect;
  subjects: string[];
  resources: string[];
  actions: string[];
  conditions: AttributeCondition[];
  priority: number;
  isActive: boolean;
  isDeleted?: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  tenantId: string | null;
  version?: number;
}

const NAME_MAX = 200;
const DESC_MAX = 1000;

export class Policy extends AggregateRoot<PolicyId> {
  private _name: string;
  private _description: string;
  private _effect: PolicyEffect;
  private _subjects: string[];
  private _resources: string[];
  private _actions: string[];
  private _conditions: AttributeCondition[];
  private _priority: number;
  private _isActive: boolean;
  private _isDeleted: boolean;
  private readonly _createdAt: Date;
  private _updatedAt: Date;
  private readonly _createdBy: string;
  private readonly _tenantId: string | null;

  private constructor(
    id: PolicyId,
    props: {
      name: string;
      description: string;
      effect: PolicyEffect;
      subjects: string[];
      resources: string[];
      actions: string[];
      conditions: AttributeCondition[];
      priority: number;
      isActive: boolean;
      isDeleted: boolean;
      createdAt: Date;
      updatedAt: Date;
      createdBy: string;
      tenantId: string | null;
      version: number;
    },
  ) {
    super(id, props.version);
    this._name = props.name;
    this._description = props.description;
    this._effect = props.effect;
    this._subjects = [...props.subjects];
    this._resources = [...props.resources];
    this._actions = [...props.actions];
    this._conditions = [...props.conditions];
    this._priority = props.priority;
    this._isActive = props.isActive;
    this._isDeleted = props.isDeleted;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
    this._createdBy = props.createdBy;
    this._tenantId = props.tenantId;
  }

  // Getters
  get name(): string { return this._name; }
  get description(): string { return this._description; }
  get effect(): PolicyEffect { return this._effect; }
  get subjects(): ReadonlyArray<string> { return this._subjects; }
  get resources(): ReadonlyArray<string> { return this._resources; }
  get actions(): ReadonlyArray<string> { return this._actions; }
  get conditions(): ReadonlyArray<AttributeCondition> { return this._conditions; }
  get priority(): number { return this._priority; }
  get isActive(): boolean { return this._isActive; }
  get isDeleted(): boolean { return this._isDeleted; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }
  get createdBy(): string { return this._createdBy; }
  get tenantId(): string | null { return this._tenantId; }

  // Factory
  static create(props: PolicyCreateProps): Result<Policy, DomainError> {
    const name = (props.name ?? '').trim();
    if (name.length === 0) {
      return err(new DomainError('POLICY_NAME_EMPTY', 'Policy name cannot be empty'));
    }
    if (name.length > NAME_MAX) {
      return err(new DomainError('POLICY_NAME_TOO_LONG', `Policy name must be ${NAME_MAX} characters or fewer`));
    }
    const description = (props.description ?? '').trim();
    if (description.length > DESC_MAX) {
      return err(new DomainError('POLICY_DESCRIPTION_TOO_LONG', `Policy description must be ${DESC_MAX} characters or fewer`));
    }
    if (!props.createdBy || props.createdBy.trim().length === 0) {
      return err(new DomainError('POLICY_CREATED_BY_EMPTY', 'Policy createdBy is required'));
    }
    const subjects = normalizeList(props.subjects);
    if (subjects.length === 0) {
      return err(new DomainError('POLICY_SUBJECTS_EMPTY', 'Policy must declare at least one subject matcher'));
    }
    const resources = normalizeList(props.resources);
    if (resources.length === 0) {
      return err(new DomainError('POLICY_RESOURCES_EMPTY', 'Policy must declare at least one resource pattern'));
    }
    const actions = normalizeList(props.actions);
    if (actions.length === 0) {
      return err(new DomainError('POLICY_ACTIONS_EMPTY', 'Policy must declare at least one action pattern'));
    }

    const now = new Date();
    const policy = new Policy(new PolicyId(), {
      name,
      description,
      effect: props.effect,
      subjects,
      resources,
      actions,
      conditions: props.conditions ? [...props.conditions] : [],
      priority: props.priority ?? 100,
      isActive: props.isActive ?? true,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
      createdBy: props.createdBy,
      tenantId: props.tenantId ?? null,
      version: 0,
    });

    policy.apply(new PolicyCreatedEvent(policy.id.value, policy.tenantId, policy.name, policy.effect));
    return ok(policy);
  }

  static reconstruct(props: PolicyReconstructProps): Policy {
    return new Policy(props.id, {
      name: props.name,
      description: props.description,
      effect: props.effect,
      subjects: props.subjects,
      resources: props.resources,
      actions: props.actions,
      conditions: props.conditions,
      priority: props.priority,
      isActive: props.isActive,
      isDeleted: props.isDeleted ?? false,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
      createdBy: props.createdBy,
      tenantId: props.tenantId,
      version: props.version ?? 0,
    });
  }

  // Evaluation
  evaluate(
    subjectDescriptors: string[],
    resource: string,
    action: string,
    flatContext: Record<string, unknown>,
  ): PolicyEffect | null {
    if (!this._isActive || this._isDeleted) return null;

    const subjectMatch = this._subjects.some((s) => s === '*' || subjectDescriptors.includes(s));
    if (!subjectMatch) return null;

    const resourceMatch = this._resources.some((r) => r === '*' || globMatch(r, resource));
    if (!resourceMatch) return null;

    const actionMatch = this._actions.some((a) => a === '*' || a === action);
    if (!actionMatch) return null;

    const conditionsPass = this._conditions.every((c) => evaluateCondition(c, flatContext));
    if (!conditionsPass) return null;

    return this._effect;
  }

  // Lifecycle
  activate(): Result<void, DomainError> {
    if (this._isDeleted) {
      return err(new DomainError('POLICY_DELETED', 'Cannot activate a deleted policy'));
    }
    if (this._isActive) {
      return err(new DomainError('POLICY_ALREADY_ACTIVE', 'Policy is already active'));
    }
    this._isActive = true;
    this._updatedAt = new Date();
    this.apply(new PolicyActivatedEvent(this.id.value, this._tenantId));
    return ok(undefined);
  }

  deactivate(): Result<void, DomainError> {
    if (this._isDeleted) {
      return err(new DomainError('POLICY_DELETED', 'Cannot deactivate a deleted policy'));
    }
    if (!this._isActive) {
      return err(new DomainError('POLICY_ALREADY_INACTIVE', 'Policy is already inactive'));
    }
    this._isActive = false;
    this._updatedAt = new Date();
    this.apply(new PolicyDeactivatedEvent(this.id.value, this._tenantId));
    return ok(undefined);
  }

  /**
   * Soft-delete the policy. Emits {@link PolicyDeletedEvent} with the
   * deleting actor so audit can record *who* removed it. Persistence is
   * expected to keep the row (flag `isDeleted = true`).
   */
  delete(deletedBy: string): Result<void, DomainError> {
    if (this._isDeleted) {
      return err(new DomainError('POLICY_ALREADY_DELETED', 'Policy is already deleted'));
    }
    const actor = (deletedBy ?? '').trim();
    if (actor.length === 0) {
      return err(new DomainError('POLICY_DELETED_BY_EMPTY', 'Policy deletion requires a deletedBy actor'));
    }
    this._isDeleted = true;
    this._isActive = false;
    this._updatedAt = new Date();
    this.apply(new PolicyDeletedEvent(this.id.value, this._tenantId, this._name, actor));
    return ok(undefined);
  }

  // Mutations
  updateName(next: string): Result<void, DomainError> {
    if (this._isDeleted) return err(new DomainError('POLICY_DELETED', 'Cannot update a deleted policy'));
    const normalized = (next ?? '').trim();
    if (normalized.length === 0) return err(new DomainError('POLICY_NAME_EMPTY', 'Policy name cannot be empty'));
    if (normalized.length > NAME_MAX) return err(new DomainError('POLICY_NAME_TOO_LONG', `Policy name must be ${NAME_MAX} characters or fewer`));
    if (normalized === this._name) return err(new DomainError('POLICY_NAME_UNCHANGED', 'Policy name is unchanged'));
    this._name = normalized;
    this.touch();
    return ok(undefined);
  }

  updateDescription(next: string): Result<void, DomainError> {
    if (this._isDeleted) return err(new DomainError('POLICY_DELETED', 'Cannot update a deleted policy'));
    const normalized = (next ?? '').trim();
    if (normalized.length > DESC_MAX) return err(new DomainError('POLICY_DESCRIPTION_TOO_LONG', `Policy description must be ${DESC_MAX} characters or fewer`));
    if (normalized === this._description) return err(new DomainError('POLICY_DESCRIPTION_UNCHANGED', 'Policy description is unchanged'));
    this._description = normalized;
    this.touch();
    return ok(undefined);
  }

  updateEffect(effect: PolicyEffect): Result<void, DomainError> {
    if (this._isDeleted) return err(new DomainError('POLICY_DELETED', 'Cannot update a deleted policy'));
    if (effect === this._effect) return err(new DomainError('POLICY_EFFECT_UNCHANGED', 'Policy effect is unchanged'));
    this._effect = effect;
    this.touch();
    return ok(undefined);
  }

  updateSubjects(next: string[]): Result<void, DomainError> {
    if (this._isDeleted) return err(new DomainError('POLICY_DELETED', 'Cannot update a deleted policy'));
    const normalized = normalizeList(next);
    if (normalized.length === 0) return err(new DomainError('POLICY_SUBJECTS_EMPTY', 'Policy must declare at least one subject matcher'));
    this._subjects = normalized;
    this.touch();
    return ok(undefined);
  }

  updateResources(next: string[]): Result<void, DomainError> {
    if (this._isDeleted) return err(new DomainError('POLICY_DELETED', 'Cannot update a deleted policy'));
    const normalized = normalizeList(next);
    if (normalized.length === 0) return err(new DomainError('POLICY_RESOURCES_EMPTY', 'Policy must declare at least one resource pattern'));
    this._resources = normalized;
    this.touch();
    return ok(undefined);
  }

  updateActions(next: string[]): Result<void, DomainError> {
    if (this._isDeleted) return err(new DomainError('POLICY_DELETED', 'Cannot update a deleted policy'));
    const normalized = normalizeList(next);
    if (normalized.length === 0) return err(new DomainError('POLICY_ACTIONS_EMPTY', 'Policy must declare at least one action pattern'));
    this._actions = normalized;
    this.touch();
    return ok(undefined);
  }

  updateConditions(next: ReadonlyArray<AttributeCondition>): Result<void, DomainError> {
    if (this._isDeleted) return err(new DomainError('POLICY_DELETED', 'Cannot update a deleted policy'));
    this._conditions = [...next];
    this.touch();
    return ok(undefined);
  }

  updatePriority(priority: number): Result<void, DomainError> {
    if (this._isDeleted) return err(new DomainError('POLICY_DELETED', 'Cannot update a deleted policy'));
    if (!Number.isFinite(priority) || priority < 0 || priority > 10_000) {
      return err(new DomainError('POLICY_PRIORITY_INVALID', 'Policy priority must be a number between 0 and 10000'));
    }
    if (priority === this._priority) {
      return err(new DomainError('POLICY_PRIORITY_UNCHANGED', 'Policy priority is unchanged'));
    }
    this._priority = priority;
    this.touch();
    return ok(undefined);
  }

  private touch(): void {
    this._updatedAt = new Date();
    this.apply(new PolicyUpdatedEvent(this.id.value, this._tenantId, this._name));
  }
}

function normalizeList(list: ReadonlyArray<string>): string[] {
  const cleaned = list
    .map((s) => (s ?? '').trim())
    .filter((s) => s.length > 0);
  return [...new Set(cleaned)];
}

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